/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import mongoose from 'mongoose'
import Voto, { ETipoVoto } from '../../models/voto'
import Mesa, { EActaEstadoMesa } from '../../models/centro_votacion/mesa'
import Organizacion from '../../models/organizacion_politica/organizacion'
import Gobernador from '../../models/organizacion_politica/gobernador'
import Alcalde from '../../models/organizacion_politica/alcalde'

/*******************************************************************************************************/
// Registrar o actualizar votos //
/*******************************************************************************************************/
export const upsert: Handler = async (req, res) => {
  // Leemos el cuerpo de la petición
  const { body } = req

  if (body.mesa) {
    try {
      if (body.organizaciones) {
        const promisesOrg = body.organizaciones.map(async org => {
          await Voto.findOneAndUpdate(
            { mesa: body.mesa._id, tipo: ETipoVoto.Partido, organizacion: org._id },
            {
              $set: {
                mesa: body.mesa._id,
                tipo: ETipoVoto.Partido,
                organizacion: org._id,
                departamento: body.mesa.departamento._id,
                provincia: body.mesa.provincia._id,
                distrito: body.mesa.distrito._id,
                anho: body.mesa.anho,
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
          { mesa: body.mesa._id, tipo: ETipoVoto.Nulo },
          {
            $set: {
              mesa: body.mesa._id,
              tipo: ETipoVoto.Nulo,
              departamento: body.mesa.departamento._id,
              provincia: body.mesa.provincia._id,
              distrito: body.mesa.distrito._id,
              anho: body.mesa.anho,
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
          { mesa: body.mesa._id, tipo: ETipoVoto.Blanco },
          {
            $set: {
              mesa: body.mesa._id,
              tipo: ETipoVoto.Blanco,
              departamento: body.mesa.departamento._id,
              provincia: body.mesa.provincia._id,
              distrito: body.mesa.distrito._id,
              anho: body.mesa.anho,
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
          { mesa: body.mesa._id, tipo: ETipoVoto.Impugnado },
          {
            $set: {
              mesa: body.mesa._id,
              tipo: ETipoVoto.Impugnado,
              departamento: body.mesa.departamento._id,
              provincia: body.mesa.provincia._id,
              distrito: body.mesa.distrito._id,
              anho: body.mesa.anho,
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

      await Mesa.findByIdAndUpdate(body.mesa._id, {
        $set: {
          ...(body.tipo === 'regional' && { acta_reg: EActaEstadoMesa.Enviado }),
          ...(body.tipo === 'provincial' && { acta_prov: EActaEstadoMesa.Enviado })
        }
      })

      // Si existe un servidor socketIO
      if (globalThis.socketIO) {
        // Emitimos el evento => acta (regional o provincial) insertada o actualizada
        globalThis.socketIO.to('app').emit('acta-upsert')
      }

      // Retornamos el status
      return res.json({
        status: true,
        msg: 'Se actualizaron los votos correctamente'
      })
    } catch (error) {
      // Mostramos el error en consola
      if (body.tipo === 'regional') {
        console.log('App Mesa', 'Guardando votos de regionales y consejeros', error)
      }
      if (body.tipo === 'provincial') {
        console.log('App Mesa', 'Guardando votos de provinciales y distritales', error)
      }
      await Mesa.findByIdAndUpdate(body.mesa._id, {
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
// Actualizar votos de actas reabiertas //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos el cuerpo de la petición
  const { body } = req

  if (body.mesa) {
    try {
      if (body.organizaciones) {
        const promisesOrg = body.organizaciones.map(async org => {
          await Voto.findOneAndUpdate(
            { mesa: body.mesa._id, tipo: ETipoVoto.Partido, organizacion: org.organizacion._id },
            {
              $set: {
                mesa: body.mesa._id,
                tipo: ETipoVoto.Partido,
                organizacion: org.organizacion._id,
                departamento: body.mesa.departamento._id,
                provincia: body.mesa.provincia._id,
                distrito: body.mesa.distrito._id,
                anho: body.mesa.anho,
                ...(body.tipo === 'regional' && { votos_gober: org.votos_gober }),
                ...(body.tipo === 'regional' && { votos_conse: org.votos_conse }),
                ...(body.tipo === 'provincial' && { votos_alc_prov: org.votos_alc_prov }),
                ...(body.tipo === 'provincial' && { votos_alc_dist: org.votos_alc_dist })
              }
            }
          )
        })
        await Promise.all(promisesOrg)
      }
      if (body.nulos) {
        await Voto.findOneAndUpdate(
          { mesa: body.mesa._id, tipo: ETipoVoto.Nulo },
          {
            $set: {
              mesa: body.mesa._id,
              tipo: ETipoVoto.Nulo,
              departamento: body.mesa.departamento._id,
              provincia: body.mesa.provincia._id,
              distrito: body.mesa.distrito._id,
              anho: body.mesa.anho,
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
          { mesa: body.mesa._id, tipo: ETipoVoto.Blanco },
          {
            $set: {
              mesa: body.mesa._id,
              tipo: ETipoVoto.Blanco,
              departamento: body.mesa.departamento._id,
              provincia: body.mesa.provincia._id,
              distrito: body.mesa.distrito._id,
              anho: body.mesa.anho,
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
          { mesa: body.mesa._id, tipo: ETipoVoto.Impugnado },
          {
            $set: {
              mesa: body.mesa._id,
              tipo: ETipoVoto.Impugnado,
              departamento: body.mesa.departamento._id,
              provincia: body.mesa.provincia._id,
              distrito: body.mesa.distrito._id,
              anho: body.mesa.anho,
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

      await Mesa.findByIdAndUpdate(body.mesa._id, {
        $set: {
          ...(body.tipo === 'regional' && { acta_reg: EActaEstadoMesa.Enviado }),
          ...(body.tipo === 'provincial' && { acta_prov: EActaEstadoMesa.Enviado })
        }
      })

      // Si existe un servidor socketIO
      if (globalThis.socketIO) {
        // Emitimos el evento => acta (regional o provincial) actualizada
        globalThis.socketIO.to('app').emit('acta-upsert')
      }

      // Retornamos el status
      return res.json({
        status: true,
        msg: 'Se actualizaron los votos correctamente'
      })
    } catch (error) {
      // Mostramos el error en consola
      if (body.tipo === 'regional') {
        console.log('App Mesa', 'Guardando votos de regionales y consejeros', error)
      }
      if (body.tipo === 'provincial') {
        console.log('App Mesa', 'Guardando votos de provinciales y distritales', error)
      }
      await Mesa.findByIdAndUpdate(body.mesa._id, {
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
export const getRegional: Handler = async (req, res) => {
  // Leemos el personero y los parámetros de la petición
  const { personero, params } = req
  // Obtenemos el Id de la mesa
  const { id } = params
  // Obtenemos el departamento y año del personero
  const { departamento, anho } = personero

  try {
    // Intentamos realizar la búsqueda de todos los gobernadores
    const list = await Voto.aggregate([
      {
        $match: {
          mesa: new mongoose.Types.ObjectId(id),
          departamento: departamento?._id,
          anho,
          tipo: ETipoVoto.Partido
        }
      },
      {
        $lookup: {
          from: Gobernador.collection.name,
          localField: 'organizacion',
          foreignField: 'organizacion',
          as: 'gobernador'
        }
      },
      {
        $unwind: '$gobernador'
      },
      {
        $match: {
          'gobernador.departamento': departamento?._id,
          'gobernador.estado': true
        }
      },
      {
        $lookup: {
          from: Organizacion.collection.name,
          localField: 'organizacion',
          foreignField: '_id',
          as: 'organizacion'
        }
      },
      {
        $unwind: '$organizacion'
      },
      {
        $match: { 'organizacion.anho': anho, 'organizacion.estado': true }
      },
      {
        $sort: { 'organizacion.nombre': 1 }
      }
    ])

    const nulos = await Voto.findOne({
      mesa: id,
      departamento: departamento?._id,
      anho,
      tipo: ETipoVoto.Nulo
    })
    const blancos = await Voto.findOne({
      mesa: id,
      departamento: departamento?._id,
      anho,
      tipo: ETipoVoto.Blanco
    })
    const impugnados = await Voto.findOne({
      mesa: id,
      departamento: departamento?._id,
      anho,
      tipo: ETipoVoto.Impugnado
    })

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
    console.log('App Mesa', 'Obteniendo votos regionales de la mesa', error)
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
export const getProvincial: Handler = async (req, res) => {
  // Leemos el personero, los parámetros y query de la petición
  const { personero, params, query } = req
  // Obtenemos el Id de la mesa
  const { id } = params
  // Obtenemos el departamento y año del personero
  const { departamento, anho } = personero

  try {
    // Intentamos realizar la búsqueda de todos los alcaldes
    const list = await Voto.aggregate([
      {
        $match: {
          mesa: new mongoose.Types.ObjectId(id),
          departamento: departamento?._id,
          anho,
          tipo: ETipoVoto.Partido
        }
      },
      {
        $lookup: {
          from: Alcalde.collection.name,
          localField: 'organizacion',
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
          'alcalde.departamento': departamento?._id,
          'alcalde.provincia': new mongoose.Types.ObjectId(query.provincia as string),
          'alcalde.estado': true
        }
      },
      {
        $lookup: {
          from: Organizacion.collection.name,
          localField: 'organizacion',
          foreignField: '_id',
          as: 'organizacion'
        }
      },
      {
        $unwind: '$organizacion'
      },
      {
        $match: { 'organizacion.anho': anho, 'organizacion.estado': true }
      },
      {
        $sort: { 'organizacion.nombre': 1 }
      }
    ])

    const nulos = await Voto.findOne({
      mesa: id,
      departamento: departamento?._id,
      anho,
      tipo: ETipoVoto.Nulo
    })
    const blancos = await Voto.findOne({
      mesa: id,
      departamento: departamento?._id,
      anho,
      tipo: ETipoVoto.Blanco
    })
    const impugnados = await Voto.findOne({
      mesa: id,
      departamento: departamento?._id,
      anho,
      tipo: ETipoVoto.Impugnado
    })

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
    console.log('App Mesa', 'Obteniendo votos provinciales y distritales de la mesa', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los votos provinciales y distritales'
    })
  }
}
