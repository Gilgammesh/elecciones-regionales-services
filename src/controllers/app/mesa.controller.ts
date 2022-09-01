/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import Mesa, { EActaEstadoMesa, IMesa } from '../../models/centro_votacion/mesa'
import { TiposPersonero } from '../centro_votacion/mesa.controller'

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const exclude_campos = '-password -createdAt -updatedAt'

/*******************************************************************************************************/
// Obtener datos de la Mesa o Mesas a cargo de un personero //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos el personero que realiza la petición
  const { personero } = req
  // Obtenemos el id, tipo, departamento y año del personero
  const { _id, tipo, departamento, anho } = personero

  try {
    if (tipo === TiposPersonero.MESA) {
      // Intentamos realizar la búsqueda de la mesa
      const mesa: IMesa | null = await Mesa.findOne(
        { personero_mesa: _id, departamento: departamento?._id, anho },
        exclude_campos
      )
        .populate('departamento', exclude_campos)
        .populate('provincia', exclude_campos)
        .populate('distrito', exclude_campos)
      // Retornamos los datos de la mesa
      return res.json({
        status: true,
        mesa
      })
    }
    if (tipo === TiposPersonero.LOCAL) {
      // Intentamos realizar la búsqueda de las mesas
      const mesas: IMesa[] = await Mesa.find(
        { personero_local: _id, departamento: departamento?._id, anho },
        exclude_campos
      )
        .populate('personero_mesa', exclude_campos)
        .populate('departamento', exclude_campos)
        .populate('provincia', exclude_campos)
        .populate('distrito', exclude_campos)
      // Retornamos la lista de mesas
      return res.json({
        status: true,
        mesas
      })
    }
    return res.json({
      status: true
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log(
      'App Mesa',
      'Obteniendo información de mesa o mesas a cargo del personero',
      _id,
      error
    )
    // Retornamos
    return res.json({
      status: false,
      msg: 'No se pudo obtener los datos de la mesa o mesas del personero'
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
    }

    return res.json({
      status: true
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('App Personero', 'Reabriendo acta de la mesa', id, error)
    // Retornamos
    return res.json({
      status: false,
      msg: 'No se pudo reabrir el acta de la mesa'
    })
  }
}
