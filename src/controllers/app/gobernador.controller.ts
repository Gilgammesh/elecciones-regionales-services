/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import mongoose from 'mongoose'
import Organizacion from '../../models/organizacion_politica/organizacion'
import Gobernador, { IGobernador } from '../../models/organizacion_politica/gobernador'
import _ from 'lodash'

/*******************************************************************************************************/
// Obtener todos los gobernadores de las organizaciones políticas //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos el personero de la petición
  const { personero } = req
  // Obtenemos el departamento y año del personero
  const { departamento, anho } = personero

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
          'gobernador.departamento': departamento?._id,
          'gobernador.estado': true
        }
      },
      {
        $sort: { nombre: 1 }
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
    console.log('App Mesa', 'Obteniendo la lista de gobernadores', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los gobernadores'
    })
  }
}
