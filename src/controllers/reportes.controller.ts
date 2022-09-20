/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import mongoose from 'mongoose'
import Voto, { ETipoVoto } from '../models/voto'
import Mesa, { EActaEstadoMesa } from '../models/centro_votacion/mesa'
import Organizacion from '../models/organizacion_politica/organizacion'
import Gobernador from '../models/organizacion_politica/gobernador'
import Alcalde from '../models/organizacion_politica/alcalde'
import Provincia from '../models/ubigeo/provincia'
import Distrito from '../models/ubigeo/distrito'

/*******************************************************************************************************/
// Obtener las estadísticas de votos de los gobernadores de las organizaciones políticas //
/*******************************************************************************************************/
export const gobernadores: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req
  // Obtenemos el año del usuario
  const { anho } = usuario

  try {
    // Obtenemos la lista de todos los gobernadores y sus votos
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
        $project: {
          nombre: 1,
          logo: 1,
          gobernador: {
            nombres: 1,
            apellidos: 1,
            foto: 1
          }
        }
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
        $project: {
          nombre: 1,
          logo: 1,
          gobernador: 1,
          votos: {
            $filter: {
              input: '$votos',
              as: 'voto',
              cond: {
                $and: [
                  {
                    $eq: ['$$voto.anho', anho]
                  },
                  {
                    $eq: [
                      '$$voto.departamento',
                      new mongoose.Types.ObjectId(query.departamento as string)
                    ]
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          nombre: 1,
          logo: 1,
          candidato: '$gobernador',
          votos: { $sum: '$votos.votos_gober' }
        }
      },
      {
        $sort: { votos: -1 }
      }
    ])

    // Obtenemos el total de votantes de las mesas
    const mesas = await Mesa.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string)
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
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string)
        }
      },
      {
        $group: {
          _id: { anho: '$anho', departamento: '$departamento' },
          totalVotos: { $sum: '$votos_gober' }
        }
      }
    ])

    // Obtenemos el total de votos nulos
    const votosNulos = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          tipo: ETipoVoto.Nulo
        }
      },
      {
        $group: {
          _id: { anho: '$anho', departamento: '$departamento' },
          totalVotos: { $sum: '$votos_gober' }
        }
      }
    ])
    // Obtenemos el total de votos en blanco
    const votosBlanco = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          tipo: ETipoVoto.Blanco
        }
      },
      {
        $group: {
          _id: { anho: '$anho', departamento: '$departamento' },
          totalVotos: { $sum: '$votos_gober' }
        }
      }
    ])
    // Obtenemos el total de votos impugnados
    const votosImpugnados = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          tipo: ETipoVoto.Impugnado
        }
      },
      {
        $group: {
          _id: { anho: '$anho', departamento: '$departamento' },
          totalVotos: { $sum: '$votos_gober' }
        }
      }
    ])

    // Total de mesas
    const totalMesas: number = await Mesa.find({
      anho,
      departamento: new mongoose.Types.ObjectId(query.departamento as string)
    }).count()
    // Total de actas procesadas
    const totalActasProcesadas: number = await Mesa.find({
      anho,
      departamento: new mongoose.Types.ObjectId(query.departamento as string),
      $or: [{ acta_reg: EActaEstadoMesa.Enviado }, { acta_reg: EActaEstadoMesa.Reabierto }]
    }).count()

    // Retornamos la lista de gobernadores y sus votos
    return res.json({
      status: true,
      totalMesas,
      totalActasProcesadas,
      totalVotantes: mesas.length > 0 ? mesas[0].totalVotantes : 0,
      totalVotos: votos.length > 0 ? votos[0].totalVotos : 0,
      totalVotosNulo: votos.length > 0 ? votosNulos[0].totalVotos : 0,
      totalVotosBlanco: votos.length > 0 ? votosBlanco[0].totalVotos : 0,
      totalVotosImpugnados: votos.length > 0 ? votosImpugnados[0].totalVotos : 0,
      registros: list.length,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Reportes', 'Obteniendo la lista de gobernadores y sus votos', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener la lista de gobernadores y sus votos'
    })
  }
}

/*******************************************************************************************************/
// Obtener las estadísticas de votos de los alcaldes provinciales de las organizaciones políticas //
/*******************************************************************************************************/
export const provinciales: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req
  // Obtenemos el año del usuario
  const { anho } = usuario

  try {
    // Obtenemos la lista de todos los alcaldes provinciales y sus votos
    const list = await Organizacion.aggregate([
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
        $project: {
          nombre: 1,
          logo: 1,
          alcalde: {
            nombres: 1,
            apellidos: 1,
            foto: 1
          }
        }
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
        $project: {
          nombre: 1,
          logo: 1,
          alcalde: 1,
          votos: {
            $filter: {
              input: '$votos',
              as: 'voto',
              cond: {
                $and: [
                  {
                    $eq: ['$$voto.anho', anho]
                  },
                  {
                    $eq: [
                      '$$voto.departamento',
                      new mongoose.Types.ObjectId(query.departamento as string)
                    ]
                  },
                  {
                    $eq: [
                      '$$voto.provincia',
                      new mongoose.Types.ObjectId(query.provincia as string)
                    ]
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          nombre: 1,
          logo: 1,
          candidato: '$alcalde',
          votos: { $sum: '$votos.votos_alc_prov' }
        }
      },
      {
        $sort: { votos: -1 }
      }
    ])

    // Obtenemos el total de votantes de las mesas
    const mesas = await Mesa.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          provincia: new mongoose.Types.ObjectId(query.provincia as string)
        }
      },
      {
        $group: {
          _id: { anho: '$anho', departamento: '$departamento', provincia: '$provincia' },
          totalVotantes: { $sum: '$votantes' }
        }
      }
    ])

    // Obtenemos el total de votos
    const votos = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          provincia: new mongoose.Types.ObjectId(query.provincia as string)
        }
      },
      {
        $group: {
          _id: { anho: '$anho', departamento: '$departamento', provincia: '$provincia' },
          totalVotos: { $sum: '$votos_alc_prov' }
        }
      }
    ])

    // Obtenemos el total de votos nulos
    const votosNulos = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          provincia: new mongoose.Types.ObjectId(query.provincia as string),
          tipo: ETipoVoto.Nulo
        }
      },
      {
        $group: {
          _id: { anho: '$anho', departamento: '$departamento', provincia: '$provincia' },
          totalVotos: { $sum: '$votos_alc_prov' }
        }
      }
    ])
    // Obtenemos el total de votos en blanco
    const votosBlanco = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          provincia: new mongoose.Types.ObjectId(query.provincia as string),
          tipo: ETipoVoto.Blanco
        }
      },
      {
        $group: {
          _id: { anho: '$anho', departamento: '$departamento', provincia: '$provincia' },
          totalVotos: { $sum: '$votos_alc_prov' }
        }
      }
    ])
    // Obtenemos el total de votos impugnados
    const votosImpugnados = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          provincia: new mongoose.Types.ObjectId(query.provincia as string),
          tipo: ETipoVoto.Impugnado
        }
      },
      {
        $group: {
          _id: { anho: '$anho', departamento: '$departamento', provincia: '$provincia' },
          totalVotos: { $sum: '$votos_alc_prov' }
        }
      }
    ])

    // Total de mesas
    const totalMesas: number = await Mesa.find({
      anho,
      departamento: new mongoose.Types.ObjectId(query.departamento as string),
      provincia: new mongoose.Types.ObjectId(query.provincia as string)
    }).count()
    // Total de actas procesadas
    const totalActasProcesadas: number = await Mesa.find({
      anho,
      departamento: new mongoose.Types.ObjectId(query.departamento as string),
      provincia: new mongoose.Types.ObjectId(query.provincia as string),
      $or: [{ acta_reg: EActaEstadoMesa.Enviado }, { acta_reg: EActaEstadoMesa.Reabierto }]
    }).count()

    // Retornamos la lista de alcaldes provinciales y sus votos
    return res.json({
      status: true,
      totalMesas,
      totalActasProcesadas,
      totalVotantes: mesas.length > 0 ? mesas[0].totalVotantes : 0,
      totalVotos: votos.length > 0 ? votos[0].totalVotos : 0,
      totalVotosNulo: votos.length > 0 ? votosNulos[0].totalVotos : 0,
      totalVotosBlanco: votos.length > 0 ? votosBlanco[0].totalVotos : 0,
      totalVotosImpugnados: votos.length > 0 ? votosImpugnados[0].totalVotos : 0,
      registros: list.length,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Reportes', 'Obteniendo la lista de alcaldes provinciales y sus votos', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener la lista de alcaldes provinciales y sus votos'
    })
  }
}

/*******************************************************************************************************/
// Obtener las estadísticas de votos de los alcaldes distritales de las organizaciones políticas //
/*******************************************************************************************************/
export const distritales: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req
  // Obtenemos el año del usuario
  const { anho } = usuario

  try {
    // Obtenemos la lista de todos los alcaldes distritales y sus votos
    const list = await Organizacion.aggregate([
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
          'alcalde.tipo': 'distrital',
          'alcalde.departamento': new mongoose.Types.ObjectId(query.departamento as string),
          'alcalde.provincia': new mongoose.Types.ObjectId(query.provincia as string),
          'alcalde.distrito': new mongoose.Types.ObjectId(query.distrito as string),
          'alcalde.estado': true
        }
      },
      {
        $project: {
          nombre: 1,
          logo: 1,
          alcalde: {
            nombres: 1,
            apellidos: 1,
            foto: 1
          }
        }
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
        $project: {
          nombre: 1,
          logo: 1,
          alcalde: 1,
          votos: {
            $filter: {
              input: '$votos',
              as: 'voto',
              cond: {
                $and: [
                  {
                    $eq: ['$$voto.anho', anho]
                  },
                  {
                    $eq: [
                      '$$voto.departamento',
                      new mongoose.Types.ObjectId(query.departamento as string)
                    ]
                  },
                  {
                    $eq: [
                      '$$voto.provincia',
                      new mongoose.Types.ObjectId(query.provincia as string)
                    ]
                  },
                  {
                    $eq: ['$$voto.distrito', new mongoose.Types.ObjectId(query.distrito as string)]
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          nombre: 1,
          logo: 1,
          candidato: '$alcalde',
          votos: { $sum: '$votos.votos_alc_dist' }
        }
      },
      {
        $sort: { votos: -1 }
      }
    ])

    // Obtenemos el total de votantes de las mesas
    const mesas = await Mesa.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          provincia: new mongoose.Types.ObjectId(query.provincia as string),
          distrito: new mongoose.Types.ObjectId(query.distrito as string)
        }
      },
      {
        $group: {
          _id: {
            anho: '$anho',
            departamento: '$departamento',
            provincia: '$provincia',
            distrito: '$distrito'
          },
          totalVotantes: { $sum: '$votantes' }
        }
      }
    ])

    // Obtenemos el total de votos
    const votos = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          provincia: new mongoose.Types.ObjectId(query.provincia as string),
          distrito: new mongoose.Types.ObjectId(query.distrito as string)
        }
      },
      {
        $group: {
          _id: {
            anho: '$anho',
            departamento: '$departamento',
            provincia: '$provincia',
            distrito: '$distrito'
          },
          totalVotos: { $sum: '$votos_alc_dist' }
        }
      }
    ])

    // Obtenemos el total de votos nulos
    const votosNulos = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          provincia: new mongoose.Types.ObjectId(query.provincia as string),
          distrito: new mongoose.Types.ObjectId(query.distrito as string),
          tipo: ETipoVoto.Nulo
        }
      },
      {
        $group: {
          _id: {
            anho: '$anho',
            departamento: '$departamento',
            provincia: '$provincia',
            distrito: '$distrito'
          },
          totalVotos: { $sum: '$votos_alc_dist' }
        }
      }
    ])
    // Obtenemos el total de votos en blanco
    const votosBlanco = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          provincia: new mongoose.Types.ObjectId(query.provincia as string),
          distrito: new mongoose.Types.ObjectId(query.distrito as string),
          tipo: ETipoVoto.Blanco
        }
      },
      {
        $group: {
          _id: {
            anho: '$anho',
            departamento: '$departamento',
            provincia: '$provincia',
            distrito: '$distrito'
          },
          totalVotos: { $sum: '$votos_alc_dist' }
        }
      }
    ])
    // Obtenemos el total de votos impugnados
    const votosImpugnados = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          provincia: new mongoose.Types.ObjectId(query.provincia as string),
          distrito: new mongoose.Types.ObjectId(query.distrito as string),
          tipo: ETipoVoto.Impugnado
        }
      },
      {
        $group: {
          _id: {
            anho: '$anho',
            departamento: '$departamento',
            provincia: '$provincia',
            distrito: '$distrito'
          },
          totalVotos: { $sum: '$votos_alc_dist' }
        }
      }
    ])

    // Total de mesas
    const totalMesas: number = await Mesa.find({
      anho,
      departamento: new mongoose.Types.ObjectId(query.departamento as string),
      provincia: new mongoose.Types.ObjectId(query.provincia as string),
      distrito: new mongoose.Types.ObjectId(query.distrito as string)
    }).count()
    // Total de actas procesadas
    const totalActasProcesadas: number = await Mesa.find({
      anho,
      departamento: new mongoose.Types.ObjectId(query.departamento as string),
      provincia: new mongoose.Types.ObjectId(query.provincia as string),
      distrito: new mongoose.Types.ObjectId(query.distrito as string),
      $or: [{ acta_reg: EActaEstadoMesa.Enviado }, { acta_reg: EActaEstadoMesa.Reabierto }]
    }).count()

    // Retornamos la lista de alcaldes distritales y sus votos
    return res.json({
      status: true,
      totalMesas,
      totalActasProcesadas,
      totalVotantes: mesas.length > 0 ? mesas[0].totalVotantes : 0,
      totalVotos: votos.length > 0 ? votos[0].totalVotos : 0,
      totalVotosNulo: votos.length > 0 ? votosNulos[0].totalVotos : 0,
      totalVotosBlanco: votos.length > 0 ? votosBlanco[0].totalVotos : 0,
      totalVotosImpugnados: votos.length > 0 ? votosImpugnados[0].totalVotos : 0,
      registros: list.length,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Reportes', 'Obteniendo la lista de alcaldes distritales y sus votos', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener la lista de alcaldes distritales y sus votos'
    })
  }
}

/*******************************************************************************************************/
// Obtener las estadísticas de votos por provincia de los candidatos //
/*******************************************************************************************************/
export const votosxProvincia: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req
  // Obtenemos el año del usuario
  const { anho } = usuario

  try {
    // Obtenemos la lista de votos por provincia
    const list = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          ...(query.organizacion !== '' && {
            organizacion: new mongoose.Types.ObjectId(query.organizacion as string)
          })
        }
      },
      {
        $group: {
          _id: { anho: '$anho', departamento: '$departamento', provincia: '$provincia' },
          votos: { $sum: '$votos_gober' }
        }
      },
      {
        $project: {
          _id: '$_id.provincia',
          votos: '$votos'
        }
      },
      {
        $lookup: {
          from: Provincia.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'provincia'
        }
      },
      {
        $unwind: '$provincia'
      },
      {
        $project: {
          _id: 1,
          nombre: '$provincia.nombre',
          votos: 1
        }
      },
      {
        $sort: { votos: -1 }
      }
    ])

    // Retornamos la lista de votos por provincia
    return res.json({
      status: true,
      registros: list.length,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Reportes', 'Obteniendo la lista de votos por provincia', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener la lista de votos por provincia'
    })
  }
}

/*******************************************************************************************************/
// Obtener las estadísticas de votos por distrito de los candidatos //
/*******************************************************************************************************/
export const votosxDistrito: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req
  // Obtenemos el año del usuario
  const { anho } = usuario

  try {
    // Obtenemos la lista de votos por distrito
    const list = await Voto.aggregate([
      {
        $match: {
          anho,
          departamento: new mongoose.Types.ObjectId(query.departamento as string),
          provincia: new mongoose.Types.ObjectId(query.provincia as string),
          ...(query.organizacion !== '' && {
            organizacion: new mongoose.Types.ObjectId(query.organizacion as string)
          })
        }
      },
      {
        $group: {
          _id: {
            anho: '$anho',
            departamento: '$departamento',
            provincia: '$provincia',
            distrito: '$distrito'
          },
          votos: { $sum: '$votos_alc_prov' }
        }
      },
      {
        $project: {
          _id: '$_id.distrito',
          votos: '$votos'
        }
      },
      {
        $lookup: {
          from: Distrito.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'distrito'
        }
      },
      {
        $unwind: '$distrito'
      },
      {
        $project: {
          _id: 1,
          nombre: '$distrito.nombre',
          votos: 1
        }
      },
      {
        $sort: { votos: -1 }
      }
    ])

    // Retornamos la lista de votos por distrito
    return res.json({
      status: true,
      registros: list.length,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Reportes', 'Obteniendo la lista de votos por distrito', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener la lista de votos por distrito'
    })
  }
}
