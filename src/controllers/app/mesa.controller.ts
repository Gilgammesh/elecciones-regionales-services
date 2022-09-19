/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import mongoose from 'mongoose'
import Mesa, { IMesa } from '../../models/centro_votacion/mesa'
import { TiposPersonero } from '../centro_votacion/mesa.controller'
import Organizacion from '../../models/organizacion_politica/organizacion'
import Gobernador from '../../models/organizacion_politica/gobernador'
import Consejero from '../../models/organizacion_politica/consejero'
import Alcalde from '../../models/organizacion_politica/alcalde'

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
// Obtener todos los gobernadores y consejeros de las organizaciones políticas //
/*******************************************************************************************************/
export const regional: Handler = async (req, res) => {
  // Leemos el personero y query de la petición
  const { personero, query } = req
  // Obtenemos el año del personero
  const { anho } = personero

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
    console.log('App Mesa', 'Obteniendo la lista de gobernadores y consejeros', error)
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
  // Leemos el personero y query de la petición
  const { personero, query } = req
  // Obtenemos el año del personero
  const { anho } = personero

  try {
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
        $project: {
          orden: 1,
          nombre: 1,
          logo: 1,
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

    // Retornamos la lista de alcaldes
    return res.json({
      status: true,
      registros: list.length,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('App Mesa', 'Obteniendo la lista de alcaldes provinciales y distritales', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los alcaldes provinciales y distritales'
    })
  }
}
