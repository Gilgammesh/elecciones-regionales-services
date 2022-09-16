/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import mongoose from 'mongoose'
import Mesa, { EActaEstadoMesa, IMesa } from '../models/centro_votacion/mesa'
import Organizacion from '../models/organizacion_politica/organizacion'
import Gobernador, { IGobernador } from '../models/organizacion_politica/gobernador'
import Alcalde, { IAlcalde } from '../models/organizacion_politica/alcalde'
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
      }
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
// Obtener todos los gobernadores de las organizaciones políticas //
/*******************************************************************************************************/
export const gobernadores: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req
  // Obtenemos el año del usuario
  const { anho } = usuario

  try {
    // Intentamos realizar la búsqueda de todos los gobernadores
    const list: Array<IGobernador> = await Organizacion.aggregate([
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
        $sort: { orden: 1 }
      }
    ])

    // Retornamos la lista de gobernadores
    return res.json({
      status: true,
      registros: list.length,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Monitoreo', 'Obteniendo la lista de gobernadores', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los gobernadores'
    })
  }
}

/*******************************************************************************************************/
// Obtener todos los alcaldes de las organizaciones políticas //
/*******************************************************************************************************/
export const alcaldes: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req
  // Obtenemos el año del usuario
  const { anho } = usuario

  try {
    // Intentamos realizar la búsqueda de todos los alcaldes
    const list: Array<IAlcalde> = await Organizacion.aggregate([
      {
        $match: { anho, estado: true }
      },
      {
        $lookup: {
          from: Alcalde.collection.name,
          localField: '_id',
          foreignField: 'organizacion',
          as: 'alcalde'
        }
      },
      {
        $unwind: '$alcalde'
      },
      {
        $match: {
          'alcalde.tipo': 'provincial',
          'alcalde.departamento': new mongoose.Types.ObjectId(query.departamento as string),
          'alcalde.provincia': new mongoose.Types.ObjectId(query.provincia as string),
          'alcalde.estado': true
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
  } catch (error) {
    // Mostramos el error en consola
    console.log('Monitoreo', 'Obteniendo la lista de alcaldes', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los alcaldes'
    })
  }
}
