/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import mongoose from 'mongoose'
import Voto, { ETipoVoto } from '../models/voto'
import Mesa, { EActaEstadoMesa } from '../models/centro_votacion/mesa'
import Organizacion, { IOrganizacion } from '../models/organizacion_politica/organizacion'
import Gobernador from '../models/organizacion_politica/gobernador'
import Consejero from '../models/organizacion_politica/consejero'
import Alcalde from '../models/organizacion_politica/alcalde'

/*******************************************************************************************************/
// Interfaces del controlador //
/*******************************************************************************************************/
interface IOrg extends IOrganizacion {
  votos_gober: number
  votos_conse: number
  votos_alc_prov: number
  votos_alc_dist: number
}

/*******************************************************************************************************/
// Registrar o actualizar votos regionales o provinciales //
/*******************************************************************************************************/
export const upsert: Handler = async (req, res) => {
  // Leemos el cuerpo de la petición
  const { body } = req

  if (body.row) {
    try {
      if (body.organizaciones) {
        const promisesOrg = body.organizaciones.map(async (org: IOrg) => {
          await Voto.findOneAndUpdate(
            { mesa: body.row._id, tipo: ETipoVoto.Partido, organizacion: org._id },
            {
              $set: {
                mesa: body.row._id,
                tipo: ETipoVoto.Partido,
                organizacion: org._id,
                departamento: body.row.departamento._id,
                provincia: body.row.provincia._id,
                distrito: body.row.distrito._id,
                anho: body.row.anho,
                ...(body.tipo === 'regional' && { votos_gober: org.votos_gober }),
                ...(body.tipo === 'regional' && { votos_conse: org.votos_conse }),
                ...(body.tipo === 'provincial' && { votos_alc_prov: org.votos_alc_prov }),
                ...(body.tipo === 'provincial' && { votos_alc_dist: org.votos_alc_dist })
              }
            },
            { upsert: true, new: true }
          )
        })
        await Promise.all(promisesOrg)
      }
      if (body.nulos) {
        await Voto.findOneAndUpdate(
          { mesa: body.row._id, tipo: ETipoVoto.Nulo },
          {
            $set: {
              mesa: body.row._id,
              tipo: ETipoVoto.Nulo,
              departamento: body.row.departamento._id,
              provincia: body.row.provincia._id,
              distrito: body.row.distrito._id,
              anho: body.row.anho,
              ...(body.tipo === 'regional' && { votos_gober: body.nulos.gober }),
              ...(body.tipo === 'regional' && { votos_conse: body.nulos.conse }),
              ...(body.tipo === 'provincial' && { votos_alc_prov: body.nulos.alc_prov }),
              ...(body.tipo === 'provincial' && { votos_alc_dist: body.nulos.alc_dist })
            }
          },
          { upsert: true, new: true }
        )
      }
      if (body.blancos) {
        await Voto.findOneAndUpdate(
          { mesa: body.row._id, tipo: ETipoVoto.Blanco },
          {
            $set: {
              mesa: body.row._id,
              tipo: ETipoVoto.Blanco,
              departamento: body.row.departamento._id,
              provincia: body.row.provincia._id,
              distrito: body.row.distrito._id,
              anho: body.row.anho,
              ...(body.tipo === 'regional' && { votos_gober: body.blancos.gober }),
              ...(body.tipo === 'regional' && { votos_conse: body.blancos.conse }),
              ...(body.tipo === 'provincial' && {
                votos_alc_prov: body.blancos.alc_prov
              }),
              ...(body.tipo === 'provincial' && { votos_alc_dist: body.blancos.alc_dist })
            }
          },
          { upsert: true, new: true }
        )
      }
      if (body.impugnados) {
        await Voto.findOneAndUpdate(
          { mesa: body.row._id, tipo: ETipoVoto.Impugnado },
          {
            $set: {
              mesa: body.row._id,
              tipo: ETipoVoto.Impugnado,
              departamento: body.row.departamento._id,
              provincia: body.row.provincia._id,
              distrito: body.row.distrito._id,
              anho: body.row.anho,
              ...(body.tipo === 'regional' && { votos_gober: body.impugnados.gober }),
              ...(body.tipo === 'regional' && { votos_conse: body.impugnados.conse }),
              ...(body.tipo === 'provincial' && {
                votos_alc_prov: body.impugnados.alc_prov
              }),
              ...(body.tipo === 'provincial' && {
                votos_alc_dist: body.impugnados.alc_dist
              })
            }
          },
          { upsert: true, new: true }
        )
      }

      await Mesa.findByIdAndUpdate(body.row._id, {
        $set: {
          ...(body.tipo === 'regional' && { acta_reg: EActaEstadoMesa.Enviado }),
          ...(body.tipo === 'provincial' && { acta_prov: EActaEstadoMesa.Enviado })
        }
      })

      // Si existe un servidor socketIO
      if (globalThis.socketIO) {
        // Emitimos el evento => acta (regional o provincial) insertada o actualizada
        globalThis.socketIO.to('app').emit('acta-upsert')
        globalThis.socketIO.to('intranet').emit('acta-upsert')
      }

      // Retornamos el status
      return res.json({
        status: true,
        msg: 'Se actualizaron los votos correctamente'
      })
    } catch (error) {
      // Mostramos el error en consola
      if (body.tipo === 'regional') {
        console.log('Monitoreo Votos', 'Guardando votos de regionales y consejeros', error)
      }
      if (body.tipo === 'provincial') {
        console.log('Monitoreo Votos', 'Guardando votos de provinciales y distritales', error)
      }
      await Mesa.findByIdAndUpdate(body.row._id, {
        $set: {
          ...(body.tipo === 'regional' && { acta_reg: EActaEstadoMesa.PorEnviar }),
          ...(body.tipo === 'provincial' && { acta_prov: EActaEstadoMesa.PorEnviar })
        }
      })
      // Retornamos
      return res.status(404).json({
        status: false,
        msg: 'No se pudo guardar los votos'
      })
    }
  }
}

/*******************************************************************************************************/
// Obtener votos regionales de una mesa //
/*******************************************************************************************************/
export const regional: Handler = async (req, res) => {
  // Leemos el usuario, query y los parámetros de la petición
  const { usuario, query, params } = req
  // Obtenemos el Id de la mesa
  const { id } = params
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
          from: Voto.collection.name,
          localField: '_id',
          foreignField: 'organizacion',
          as: 'votos'
        }
      },
      {
        $unwind: '$votos'
      },
      {
        $match: {
          'votos.mesa': new mongoose.Types.ObjectId(id),
          'votos.departamento': new mongoose.Types.ObjectId(query.departamento as string),
          'votos.anho': anho,
          'votos.tipo': ETipoVoto.Partido
        }
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
          votos_gober: '$votos.votos_gober',
          votos_conse: '$votos.votos_conse',
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
          votos_gober: 1,
          votos_conse: 1,
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

    const nulos = await Voto.findOne(
      {
        mesa: id,
        departamento: new mongoose.Types.ObjectId(query.departamento as string),
        anho,
        tipo: ETipoVoto.Nulo
      },
      '-_id votos_gober votos_conse'
    )
    const blancos = await Voto.findOne(
      {
        mesa: id,
        departamento: new mongoose.Types.ObjectId(query.departamento as string),
        anho,
        tipo: ETipoVoto.Blanco
      },
      '-_id votos_gober votos_conse'
    )
    const impugnados = await Voto.findOne(
      {
        mesa: id,
        departamento: new mongoose.Types.ObjectId(query.departamento as string),
        anho,
        tipo: ETipoVoto.Impugnado
      },
      '-_id votos_gober votos_conse'
    )

    // Retornamos la lista de votos
    return res.json({
      status: true,
      list,
      nulos,
      blancos,
      impugnados
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Monitoreo Votos', 'Obteniendo votos regionales de la mesa', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los votos regionales'
    })
  }
}

/*******************************************************************************************************/
// Obtener votos provinciales y distritales de una mesa //
/*******************************************************************************************************/
export const provincial: Handler = async (req, res) => {
  // Leemos el usuario, query y los parámetros de la petición
  const { usuario, query, params } = req
  // Obtenemos el Id de la mesa
  const { id } = params
  // Obtenemos el año del usuario
  const { anho } = usuario

  try {
    // Intentamos realizar la búsqueda de todos los alcaldes provinciales y distritales
    const list = await Organizacion.aggregate([
      {
        $match: { anho, estado: true }
      },
      {
        $lookup: {
          from: Voto.collection.name,
          localField: '_id',
          foreignField: 'organizacion',
          as: 'votos'
        }
      },
      {
        $unwind: '$votos'
      },
      {
        $match: {
          'votos.mesa': new mongoose.Types.ObjectId(id),
          'votos.departamento': new mongoose.Types.ObjectId(query.departamento as string),
          'votos.anho': anho,
          'votos.tipo': ETipoVoto.Partido
        }
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
        $project: {
          orden: 1,
          nombre: 1,
          logo: 1,
          votos_alc_prov: '$votos.votos_alc_prov',
          votos_alc_dist: '$votos.votos_alc_dist',
          alcaldeProv: {
            $filter: {
              input: '$alcaldeProv',
              as: 'alcalde',
              cond: {
                $and: [
                  {
                    $eq: ['$$alcalde.tipo', 'provincial']
                  },
                  {
                    $eq: [
                      '$$alcalde.departamento',
                      new mongoose.Types.ObjectId(query.departamento as string)
                    ]
                  },
                  {
                    $eq: [
                      '$$alcalde.provincia',
                      new mongoose.Types.ObjectId(query.provincia as string)
                    ]
                  },
                  { $eq: ['$$alcalde.estado', true] }
                ]
              }
            }
          }
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
        $project: {
          orden: 1,
          nombre: 1,
          logo: 1,
          votos_alc_prov: 1,
          votos_alc_dist: 1,
          alcaldeProv: 1,
          alcaldeDist: {
            $filter: {
              input: '$alcaldeDist',
              as: 'alcalde',
              cond: {
                $and: [
                  {
                    $eq: ['$$alcalde.tipo', 'distrital']
                  },
                  {
                    $eq: [
                      '$$alcalde.departamento',
                      new mongoose.Types.ObjectId(query.departamento as string)
                    ]
                  },
                  {
                    $eq: [
                      '$$alcalde.provincia',
                      new mongoose.Types.ObjectId(query.provincia as string)
                    ]
                  },
                  {
                    $eq: [
                      '$$alcalde.distrito',
                      new mongoose.Types.ObjectId(query.distrito as string)
                    ]
                  },
                  { $eq: ['$$alcalde.estado', true] }
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
          votos_alc_prov: 1,
          votos_alc_dist: 1,
          alcaldeProv: 1,
          alcaldeDist: {
            _id: 1,
            nombres: 1,
            apellidos: 1,
            dni: 1,
            foto: 1
          }
        }
      },
      {
        $match: {
          $or: [{ 'alcaldeProv.0': { $exists: true } }, { 'alcaldeDist.0': { $exists: true } }]
        }
      },
      {
        $sort: { orden: 1 }
      }
    ])

    const nulos = await Voto.findOne(
      {
        mesa: id,
        departamento: new mongoose.Types.ObjectId(query.departamento as string),
        anho,
        tipo: ETipoVoto.Nulo
      },
      '-_id votos_alc_prov votos_alc_dist'
    )
    const blancos = await Voto.findOne(
      {
        mesa: id,
        departamento: new mongoose.Types.ObjectId(query.departamento as string),
        anho,
        tipo: ETipoVoto.Blanco
      },
      '-_id votos_alc_prov votos_alc_dist'
    )
    const impugnados = await Voto.findOne(
      {
        mesa: id,
        departamento: new mongoose.Types.ObjectId(query.departamento as string),
        anho,
        tipo: ETipoVoto.Impugnado
      },
      '-_id votos_alc_prov votos_alc_dist'
    )

    // Retornamos la lista de votos
    return res.json({
      status: true,
      list,
      nulos,
      blancos,
      impugnados
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Monitoreo Votos', 'Obteniendo votos provinciales y distritales de la mesa', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los votos provinciales y distritales'
    })
  }
}
