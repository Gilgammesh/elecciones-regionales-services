/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import mongoose from 'mongoose'
import Organizacion from '../../models/organizacion_politica/organizacion'
import Alcalde, { IAlcalde } from '../../models/organizacion_politica/alcalde'

/*******************************************************************************************************/
// Obtener todos los alcaldes de las organizaciones políticas //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos el personero de la petición
  const { personero, query } = req
  // Obtenemos el departamento y año del personero
  const { departamento, anho } = personero

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
          'alcalde.departamento': departamento?._id,
          'alcalde.provincia': new mongoose.Types.ObjectId(query.provincia as string),
          'alcalde.estado': true
        }
      },
      {
        $sort: { nombre: 1 }
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
    console.log('App Mesa', 'Obteniendo la lista de alcaldes', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los alcaldes'
    })
  }
}
