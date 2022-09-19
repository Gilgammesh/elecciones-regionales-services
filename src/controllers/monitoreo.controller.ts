/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import mongoose from 'mongoose'
import Mesa, { EActaEstadoMesa, IMesa } from '../models/centro_votacion/mesa'
import Organizacion from '../models/organizacion_politica/organizacion'
import Gobernador from '../models/organizacion_politica/gobernador'
import Consejero from '../models/organizacion_politica/consejero'
import Alcalde from '../models/organizacion_politica/alcalde'
import Distrito, { IDistrito } from '../models/ubigeo/distrito'
import Voto from '../models/voto'
import { getPage, getPageSize, getTotalPages } from '../helpers/pagination'

/*******************************************************************************************************/
// Enums e Interfaces del Componente //
/*******************************************************************************************************/
enum EMesaEstadoActa {
  Enviado = 'enviado',
  PorEnviar = 'por enviar',
  Reabierto = 'reabierto'
}

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todas las mesas de votación y sus estados //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para las mesas de votación
    let queryMesas = {}
    // Definimos el query para las actas
    let queryActas = {}

    // Añadimos el año
    queryMesas = { ...queryMesas, anho: usuario.anho }
    queryActas = { ...queryActas, anho: usuario.anho }

    // Filtramos por el query de departamento
    if (query.departamento && query.departamento !== 'todos') {
      if (usuario.rol.super) {
        queryMesas = {
          ...queryMesas,
          departamento: query.departamento
        }
        queryActas = {
          ...queryActas,
          departamento: query.departamento
        }
      } else {
        queryMesas = {
          ...queryMesas,
          departamento: usuario.departamento?._id
        }
        queryActas = {
          ...queryActas,
          departamento: usuario.departamento?._id
        }
      }
    }

    // Si existe un query de búsqueda
    if (query.searchTipo && query.searchTipo !== '') {
      if (query.searchTipo === 'mesa') {
        queryMesas = {
          ...queryMesas,
          mesa: {
            $regex: `.*${query.searchValue as string}.*`,
            $options: 'i'
          }
        }
      }
      if (query.searchTipo === 'local') {
        queryMesas = {
          ...queryMesas,
          local: {
            $regex: `.*${query.searchValue as string}.*`,
            $options: 'i'
          }
        }
      }
    } else {
      // Filtramos por el query de provincia
      if (query.provincia && query.provincia !== 'todos') {
        queryMesas = {
          ...queryMesas,
          provincia: query.provincia
        }
      }
      // Filtramos por el query de distrito
      if (query.distrito && query.distrito !== 'todos') {
        queryMesas = {
          ...queryMesas,
          distrito: query.distrito
        }
      }
      // Filtramos por el query de estado de acta regional
      if (query.estadoActaReg && query.estadoActaReg !== 'todos') {
        queryMesas = {
          ...queryMesas,
          acta_reg: query.estadoActaReg
        }
      }
      // Filtramos por el query de estado de acta provincial
      if (query.estadoActaProv && query.estadoActaProv !== 'todos') {
        queryMesas = {
          ...queryMesas,
          acta_prov: query.estadoActaProv
        }
      }
    }

    // Intentamos obtener el total de registros de mesas de votación
    const totalRegistros: number = await Mesa.find(queryMesas).count()

    // Total de actas
    const totalActas: number = await Mesa.find(queryActas).count()
    // Total de actas regionales
    const totalActasRegEnviadas: number = await Mesa.find({
      ...queryActas,
      acta_reg: EMesaEstadoActa.Enviado
    }).count()
    const totalActasRegPorenviar: number = await Mesa.find({
      ...queryActas,
      acta_reg: EMesaEstadoActa.PorEnviar
    }).count()
    const totalActasRegReabiertas: number = await Mesa.find({
      ...queryActas,
      acta_reg: EMesaEstadoActa.Reabierto
    }).count()
    // Total de actas provinciales
    const totalActasProvEnviadas: number = await Mesa.find({
      ...queryActas,
      acta_prov: EMesaEstadoActa.Enviado
    }).count()
    const totalActasProvPorenviar: number = await Mesa.find({
      ...queryActas,
      acta_prov: EMesaEstadoActa.PorEnviar
    }).count()
    const totalActasProvReabiertas: number = await Mesa.find({
      ...queryActas,
      acta_prov: EMesaEstadoActa.Reabierto
    }).count()

    // Obtenemos el número de registros por página y hacemos las validaciones
    const validatePageSize = await getPageSize(pagination.pageSize, query.pageSize as string)
    if (!validatePageSize.status) {
      return res.status(404).json({
        status: validatePageSize.status,
        msg: validatePageSize.msg
      })
    }
    const pageSize = validatePageSize.size as number

    // Obtenemos el número total de páginas
    const totalPaginas: number = getTotalPages(totalRegistros, pageSize)

    // Obtenemos el número de página y hacemos las validaciones
    const validatePage = await getPage(pagination.page, query.page as string, totalPaginas)
    if (!validatePage.status) {
      return res.status(404).json({
        status: validatePage.status,
        msg: validatePage.msg
      })
    }
    const page = validatePage.page as number

    // Intentamos realizar la búsqueda de todos los centros de votación paginados
    const list: Array<IMesa> = await Mesa.find(queryMesas, exclude_campos)
      .sort({ ubigeo: 'asc', mesa: 'asc' })
      .populate('departamento', exclude_campos)
      .populate('provincia', exclude_campos)
      .populate('distrito', exclude_campos)
      .populate('personero_local', exclude_campos)
      .populate('personero_mesa', exclude_campos)
      .collation({ locale: 'es', numericOrdering: true })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Obtenemos el total de votantes de las mesas
    const mesas = await Mesa.aggregate([
      {
        $match: {
          anho: usuario.anho,
          departamento: usuario.rol.super
            ? new mongoose.Types.ObjectId(query.departamento as string)
            : usuario.departamento?._id
        }
      },
      {
        $group: {
          _id: { anho: '$anho', departamento: '$departamento' },
          totalVotantes: { $sum: '$votantes' }
        }
      }
    ])

    // Obtenemos el total de votos
    const votos = await Voto.aggregate([
      {
        $match: {
          anho: usuario.anho,
          departamento: usuario.rol.super
            ? new mongoose.Types.ObjectId(query.departamento as string)
            : usuario.departamento?._id
        }
      },
      {
        $group: {
          _id: { anho: '$anho', departamento: '$departamento' },
          totalVotosGober: { $sum: '$votos_gober' },
          totalVotosConse: { $sum: '$votos_conse' },
          totalVotosAlcProv: { $sum: '$votos_alc_prov' },
          totalVotosAlcDist: { $sum: '$votos_alc_dist' }
        }
      }
    ])

    // Retornamos la lista de centros de votación
    return res.json({
      status: true,
      pagina: page,
      totalPaginas,
      registros: list.length,
      totalRegistros,
      list,
      totalActas,
      totalActasReg: {
        enviadas: totalActasRegEnviadas,
        porenviar: totalActasRegPorenviar,
        reabiertas: totalActasRegReabiertas
      },
      totalActasProv: {
        enviadas: totalActasProvEnviadas,
        porenviar: totalActasProvPorenviar,
        reabiertas: totalActasProvReabiertas
      },
      totalVotantes: mesas.length > 0 ? mesas[0].totalVotantes : 0,
      totalVotosGober: votos.length > 0 ? votos[0].totalVotosGober : 0,
      totalVotosConse: votos.length > 0 ? votos[0].totalVotosConse : 0,
      totalVotosAlcProv: votos.length > 0 ? votos[0].totalVotosAlcProv : 0,
      totalVotosAlcDist: votos.length > 0 ? votos[0].totalVotosAlcDist : 0
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Monitoreo', 'Obteniendo la lista de mesas de votación', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener las mesas de votación'
    })
  }
}

/*******************************************************************************************************/
// Reabrir acta regional o provincial de una mesa  //
/*******************************************************************************************************/
export const reopen: Handler = async (req, res) => {
  // Leemos los parámetris y el query de la petición
  const { params, query } = req
  // Obtenemos el Id de la mesa
  const { id } = params

  try {
    await Mesa.findByIdAndUpdate(id, {
      $set: {
        ...(query.acta && query.acta === 'regional' && { acta_reg: EActaEstadoMesa.Reabierto }),
        ...(query.acta && query.acta === 'provincial' && { acta_prov: EActaEstadoMesa.Reabierto })
      }
    })

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => acta (regional o provincial) reabierta
      globalThis.socketIO.to('app').emit('acta-reopen')
      globalThis.socketIO.to('intranet').emit('acta-reopen')
    }

    return res.json({
      status: true
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Monitoreo', 'Reabriendo acta de la mesa', id, error)
    // Retornamos
    return res.json({
      status: false,
      msg: 'No se pudo reabrir el acta de la mesa'
    })
  }
}

/*******************************************************************************************************/
// Obtener todos los gobernadores y consejeros de las organizaciones políticas //
/*******************************************************************************************************/
export const regional: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req
  // Obtenemos el año del usuario
  const { anho } = usuario

  try {
    // Intentamos realizar la búsqueda de todos los gobernadores y consejeros
    const list = await Organizacion.aggregate([
      {
        $match: { anho, estado: true }
      },
      {
        $lookup: {
          from: Gobernador.collection.name,
          localField: '_id',
          foreignField: 'organizacion',
          as: 'gobernador'
        }
      },
      {
        $unwind: '$gobernador'
      },
      {
        $match: {
          'gobernador.departamento': new mongoose.Types.ObjectId(query.departamento as string),
          'gobernador.estado': true
        }
      },
      {
        $lookup: {
          from: Consejero.collection.name,
          localField: '_id',
          foreignField: 'organizacion',
          as: 'consejeros'
        }
      },
      {
        $project: {
          orden: 1,
          nombre: 1,
          logo: 1,
          gobernador: {
            _id: 1,
            nombres: 1,
            apellidos: 1,
            dni: 1,
            foto: 1
          },
          consejeros: {
            $filter: {
              input: '$consejeros',
              as: 'consejero',
              cond: {
                $and: [
                  {
                    $eq: [
                      '$$consejero.departamento',
                      new mongoose.Types.ObjectId(query.departamento as string)
                    ]
                  },
                  {
                    $eq: [
                      '$$consejero.provincia',
                      new mongoose.Types.ObjectId(query.provincia as string)
                    ]
                  },
                  { $eq: ['$$consejero.estado', true] }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          orden: 1,
          nombre: 1,
          logo: 1,
          gobernador: 1,
          consejeros: {
            _id: 1,
            numero: 1,
            nombres: 1,
            apellidos: 1,
            dni: 1,
            foto: 1
          }
        }
      },
      {
        $sort: { orden: 1 }
      }
    ])

    // Retornamos la lista de gobernadores y consejeros
    return res.json({
      status: true,
      registros: list.length,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Monitoreo', 'Obteniendo la lista de gobernadores y consejeros', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los gobernadores y consejeros'
    })
  }
}

/*******************************************************************************************************/
// Obtener todos los alcaldes provinciales y distritales de las organizaciones políticas //
/*******************************************************************************************************/
export const provincial: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req
  // Obtenemos el año del usuario
  const { anho } = usuario

  try {
    // Verificamos si el distrito es capital de provincia
    const distrito: IDistrito | null = await Distrito.findById(query.distrito as string)

    // Si existe un distrito
    if (distrito) {
      // Si el distrito es capital de provincia
      if (distrito.codigo === '01') {
        // Intentamos realizar la búsqueda de todos los alcaldes provinciales y distritales
        const list = await Organizacion.aggregate([
          {
            $match: { anho, estado: true }
          },
          {
            $lookup: {
              from: Alcalde.collection.name,
              localField: '_id',
              foreignField: 'organizacion',
              as: 'alcaldeProv'
            }
          },
          {
            $unwind: '$alcaldeProv'
          },
          {
            $match: {
              'alcaldeProv.tipo': 'provincial',
              'alcaldeProv.departamento': new mongoose.Types.ObjectId(query.departamento as string),
              'alcaldeProv.provincia': new mongoose.Types.ObjectId(query.provincia as string),
              'alcaldeProv.estado': true
            }
          },
          {
            $project: {
              orden: 1,
              nombre: 1,
              logo: 1,
              alcaldeProv: {
                _id: 1,
                nombres: 1,
                apellidos: 1,
                dni: 1,
                foto: 1
              }
            }
          },
          {
            $sort: { orden: 1 }
          }
        ])

        // Retornamos la lista de alcaldes
        return res.json({
          status: true,
          registros: list.length,
          list
        })
      } else {
        // Intentamos realizar la búsqueda de todos los alcaldes provinciales y distritales
        const list = await Organizacion.aggregate([
          {
            $match: { anho, estado: true }
          },
          {
            $lookup: {
              from: Alcalde.collection.name,
              localField: '_id',
              foreignField: 'organizacion',
              as: 'alcaldeProv'
            }
          },
          {
            $unwind: '$alcaldeProv'
          },
          {
            $match: {
              'alcaldeProv.tipo': 'provincial',
              'alcaldeProv.departamento': new mongoose.Types.ObjectId(query.departamento as string),
              'alcaldeProv.provincia': new mongoose.Types.ObjectId(query.provincia as string),
              'alcaldeProv.estado': true
            }
          },
          {
            $lookup: {
              from: Alcalde.collection.name,
              localField: '_id',
              foreignField: 'organizacion',
              as: 'alcaldeDist'
            }
          },
          {
            $unwind: '$alcaldeDist'
          },
          {
            $match: {
              'alcaldeDist.tipo': 'distrital',
              'alcaldeDist.departamento': new mongoose.Types.ObjectId(query.departamento as string),
              'alcaldeDist.provincia': new mongoose.Types.ObjectId(query.provincia as string),
              'alcaldeDist.distrito': new mongoose.Types.ObjectId(query.distrito as string),
              'alcaldeDist.estado': true
            }
          },
          {
            $project: {
              orden: 1,
              nombre: 1,
              logo: 1,
              alcaldeProv: {
                _id: 1,
                nombres: 1,
                apellidos: 1,
                dni: 1,
                foto: 1
              },
              alcaldeDist: {
                _id: 1,
                nombres: 1,
                apellidos: 1,
                dni: 1,
                foto: 1,
                distrito: 1
              }
            }
          },
          {
            $sort: { orden: 1 }
          }
        ])

        // Retornamos la lista de alcaldes
        return res.json({
          status: true,
          registros: list.length,
          list
        })
      }
    }
  } catch (error) {
    // Mostramos el error en consola
    console.log('Monitoreo', 'Obteniendo la lista de alcaldes provinciales y distritales', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los alcaldes provinciales y distritales'
    })
  }
}
