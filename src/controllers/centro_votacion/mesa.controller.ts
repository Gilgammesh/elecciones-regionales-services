/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import fs from 'fs'
import { join } from 'path'
import { Error } from 'mongoose'
import { UploadedFile } from 'express-fileupload'
import xlsxFile from 'read-excel-file/node'
import excel from 'excel4node'
import { Row } from 'read-excel-file/types'
import Personero, { IPersonero } from '../../models/centro_votacion/personero'
import Mesa, { IMesa } from '../../models/centro_votacion/mesa'
import Departamento, { IDepartamento } from '../../models/ubigeo/departamento'
import Provincia, { IProvincia } from '../../models/ubigeo/provincia'
import Distrito, { IDistrito } from '../../models/ubigeo/distrito'
import _ from 'lodash'
import { storeFile } from '../../helpers/upload'
import { saveLog } from '../admin/log.controller'
import { parseNewDate24H_ } from '../../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../../helpers/pagination'
import { eventsLogs } from '../../models/admin/log'
import { getHost } from '../../helpers/host'

/*******************************************************************************************************/
// Enums e Interfaces del Componente //
/*******************************************************************************************************/
export const TiposPersonero = {
  MESA: 'mesa',
  LOCAL: 'local'
}
const ActionsPersonero = {
  ADD: 'add',
  CHANGE: 'change',
  REMOVE: 'remove'
}
interface IRegex {
  $regex: string
  $options: string
}

interface IQueryPersoneros {
  departamento: string
  nombres: IRegex
  apellidos: IRegex
  dni: IRegex
  asignado: boolean
}

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo = 'centros-votacion'
const nombre_submodulo = 'mesas'
const nombre_controlador = 'mesa.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todas las mesas de votación //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para las mesas de votación
    let queryMesas = {}

    // Añadimos el año
    queryMesas = { ...queryMesas, anho: usuario.anho }
    // Obtenemos el código del departamente según el caso
    const codDpto: string = usuario.rol.super
      ? (query.departamento as string)
      : (usuario.departamento?.codigo as string)
    // Filtramos por el query de departamento
    if (query.departamento && query.departamento !== 'todos') {
      queryMesas = {
        ...queryMesas,
        ubigeo: { $regex: `^${codDpto}.*` }
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
      // Filtramos por el query de estado de personero
      if (query.assign && query.assign !== 'todos') {
        queryMesas = {
          ...queryMesas,
          $or: [
            { personero_mesa: { $exists: query.assign } },
            { personero_local: { $exists: query.assign } }
          ]
        }
      }
      // Filtramos por el query de provincia
      if (query.provincia && query.provincia !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: { $regex: `^${codDpto}${query.provincia}.*` }
        }
      }
      // Filtramos por el query de distrito
      if (query.distrito && query.distrito !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: { $regex: `^${codDpto}${query.provincia}${query.distrito}.*` }
        }
      }
    }

    // Intentamos obtener el total de registros de mesas de votación
    const totalRegistros: number = await Mesa.find(queryMesas).count()

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
      .populate('personero_provincia', exclude_campos)
      .populate('personero_distrito', exclude_campos)
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
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Centros de Votación', 'Obteniendo la lista de mesas de votación', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener las mesas de votación'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de una mesa de votación //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id de la mesa de votación
  const { id } = params

  try {
    // Intentamos realizar la búsqueda por id
    const mesa: IMesa | null = await Mesa.findById(id, exclude_campos)
      .populate('departamento', exclude_campos)
      .populate('provincia', exclude_campos)
      .populate('distrito', exclude_campos)
      .populate('personero_provincia', exclude_campos)
      .populate('personero_distrito', exclude_campos)
      .populate('personero_local', exclude_campos)
      .populate('personero_mesa', exclude_campos)

    // Retornamos los datos de la mesa de votación encontrada
    return res.json({
      status: true,
      mesa
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Centros de Votación', 'Obteniendo datos de mesa de votación', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos de la mesa de votación'
    })
  }
}

/*******************************************************************************************************/
// Crear una nueva mesa de votación //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, el cuerpo y los archivos de la petición
  const { headers, usuario, body } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Verificamos si ya existe la mesa de votación
    const mesaU = await Mesa.findOne({
      mesa: body.mesa,
      anho: usuario.anho
    })
    // Si existe una mesa
    if (mesaU) {
      return res.status(404).json({
        status: false,
        msg: `Ya existe la mesa de votación para estas elecciones ${usuario.anho}`
      })
    }

    // Inicializamos el código de departamento
    let codDpto: string | undefined = ''
    // Si no es un superusuario
    if (usuario.rol.super) {
      codDpto = body.departamento
    } else {
      codDpto = usuario.departamento?.codigo
    }

    // Obtenemos los datos del departamento si existe
    const departamento: IDepartamento | null = await Departamento.findOne({
      codigo: codDpto
    })

    // Obtenemos los datos de la provincia si existe si existe
    const provincia: IProvincia | null = await Provincia.findOne({
      codigo: body.provincia,
      departamento: codDpto
    })

    // Obtenemos los datos del distrito si existe
    const distrito: IDistrito | null = await Distrito.findOne({
      codigo: body.distrito,
      provincia: body.provincia,
      departamento: codDpto
    })

    // Creamos el modelo de una nueva mesa de votacion
    const newMesa: IMesa = new Mesa({
      mesa: body.mesa,
      local: body.local,
      departamento: departamento?._id,
      provincia: provincia?._id,
      distrito: distrito?._id,
      ubigeo: body.ubigeo,
      ...(body.votantes && {
        votantes: parseInt(body.votantes, 10)
      }),
      ...(body.personero_mesa && {
        personero_mesa: body.personero_mesa
      }),
      anho: usuario.anho
    })

    // Intentamos guardar la nueva mesa de votación
    const mesaOut: IMesa = await newMesa.save()

    // Si existe un personero de mesa
    if (body.personero_mesa) {
      await Personero.findByIdAndUpdate(
        body.personero_mesa,
        {
          $set: {
            asignado: true,
            tipo: TiposPersonero.MESA,
            asignadoA: body.mesa
          }
        },
        {
          new: true,
          runValidators: true,
          context: 'query'
        }
      )
    }

    // Guardamos el log del evento
    await saveLog({
      usuario: usuario._id,
      fuente: <string>source,
      origen: <string>origin,
      ip: <string>ip,
      dispositivo: <string>device,
      navegador: <string>browser,
      modulo: nombre_modulo,
      submodulo: nombre_submodulo,
      controller: nombre_controlador,
      funcion: 'create',
      descripcion: 'Crear nueva mesa de votación',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(mesaOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos la mesa de votación creada
    const mesaResp: IMesa | null = await Mesa.findById(mesaOut._id, exclude_campos)

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => mesa creada en el módulo centros de votación
      globalThis.socketIO.to('intranet').emit('centros-votacion-mesa-creada')
    }

    // Retornamos la mesa de votación creada
    return res.json({
      status: true,
      msg: 'Se creó la mesa de votación correctamente',
      mesa: mesaResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Centros de Votación', 'Crear nueva mesa de votación', error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo crear la mesa de votación'
    if (error instanceof Error.ValidationError) {
      // Si existe un error con validación de campo único
      if (error.errors) {
        Object.entries(error.errors).forEach((item, index) => {
          if (item[1] instanceof Error.ValidatorError && index === 0) {
            msg = `${item[1].path}: ${item[1].properties.message}`
          }
        })
      }
    }

    // Retornamos
    return res.status(404).json({
      status: false,
      msg
    })
  }
}

/*******************************************************************************************************/
// Actualizar los datos de una mesa de votación //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros y el cuerpo de la petición
  const { headers, usuario, params, body } = req
  // Obtenemos el Id de la mesa de votación
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener la mesa de votación antes que se actualice
    const mesaIn: IMesa | null = await Mesa.findById(id)

    // Intentamos realizar la búsqueda por id y actualizamos
    let mesaOut: IMesa | null = null

    // Si existe un tipo en el cuerpo (Asignar personero)
    if (body.tipoPers && body.tipoPers !== '') {
      if (body.tipoPers === TiposPersonero.MESA) {
        mesaOut = await Mesa.findByIdAndUpdate(
          id,
          body.actionPers === ActionsPersonero.REMOVE
            ? { $unset: { personero_mesa: 1 } }
            : { $set: { personero_mesa: body.personero } },
          { new: true }
        )
        if (body.actionPers === ActionsPersonero.CHANGE) {
          await Personero.findByIdAndUpdate(
            mesaIn?.personero_mesa,
            {
              $set: { asignado: false },
              $unset: { tipo: 1, asignadoA: 1 }
            },
            { new: true }
          )
        }
        await Personero.findByIdAndUpdate(
          body.personero,
          body.actionPers === ActionsPersonero.REMOVE
            ? {
                $set: { asignado: false },
                $unset: { tipo: 1, asignadoA: 1 }
              }
            : {
                $set: {
                  asignado: true,
                  tipo: TiposPersonero.MESA,
                  asignadoA: body.mesa.mesa
                }
              },
          { new: true }
        )
      }
      if (body.tipoPers === TiposPersonero.LOCAL) {
        await Mesa.updateMany(
          { local: body.mesa.local },
          body.actionPers === ActionsPersonero.REMOVE
            ? { $unset: { personero_local: 1 } }
            : { $set: { personero_local: body.personero } },
          { new: true }
        )
        if (body.actionPers === ActionsPersonero.CHANGE) {
          await Personero.findByIdAndUpdate(
            mesaIn?.personero_local,
            {
              $set: { asignado: false },
              $unset: { tipo: 1, asignadoA: 1 }
            },
            { new: true }
          )
        }
        await Personero.findByIdAndUpdate(
          body.personero,
          body.actionPers === ActionsPersonero.REMOVE
            ? {
                $set: { asignado: false },
                $unset: { tipo: 1, asignadoA: 1 }
              }
            : {
                $set: {
                  asignado: true,
                  tipo: TiposPersonero.LOCAL,
                  asignadoA: body.mesa.local
                }
              },
          { new: true }
        )
      }
    } else {
      // Obtenemos los datos del departamento si existe
      const departamento: IDepartamento | null = await Departamento.findOne({
        codigo: body.departamento
      })
      // Obtenemos los datos de la provincia si existe si existe
      const provincia: IProvincia | null = await Provincia.findOne({
        codigo: body.provincia,
        departamento: body.departamento
      })
      // Obtenemos los datos del distrito si existe
      const distrito: IDistrito | null = await Distrito.findOne({
        codigo: body.distrito,
        provincia: body.provincia,
        departamento: body.departamento
      })

      // Actualizamos los datos de la mesa
      mesaOut = await Mesa.findByIdAndUpdate(
        id,
        {
          $set: {
            mesa: body.mesa,
            local: body.local,
            departamento: departamento?._id,
            provincia: provincia?._id,
            distrito: distrito?._id,
            ubigeo: body.ubigeo,
            ...(body.votantes && {
              votantes: parseInt(body.votantes, 10)
            }),
            ...(body.personero_mesa && {
              personero_mesa: body.personero_mesa
            }),
            ...(body.personero_local && {
              personero_local: body.personero_local
            })
          },
          $unset: {
            ...(!body.personero_mesa && {
              personero_mesa: 1
            }),
            ...(!body.personero_local && {
              personero_local: 1
            })
          }
        },
        { new: true }
      )

      if (mesaIn) {
        if (mesaIn.local !== body.local) {
          await Mesa.updateMany(
            { local: mesaIn.local },
            {
              $set: { local: body.local }
            }
          )
        }
        // Si existia un personero de mesa antes de actualizar
        if (mesaIn.personero_mesa) {
          if (!body.personero_mesa) {
            await Personero.findByIdAndUpdate(
              mesaIn.personero_mesa,
              {
                $set: { asignado: false },
                $unset: { tipo: 1, asignadoA: 1 }
              },
              { new: true }
            )
          }
          if (body.personero_mesa && body.personero_mesa !== mesaIn.personero_mesa) {
            await Personero.findByIdAndUpdate(
              mesaIn.personero_mesa,
              {
                $set: { asignado: false },
                $unset: { tipo: 1, asignadoA: 1 }
              },
              { new: true }
            )
            await Personero.findByIdAndUpdate(
              body.personero_mesa,
              {
                $set: {
                  asignado: true,
                  tipo: TiposPersonero.MESA,
                  asignadoA: body.mesa
                }
              },
              { new: true }
            )
          }
        } else {
          if (body.personero_mesa) {
            await Personero.findByIdAndUpdate(
              body.personero_mesa,
              {
                $set: {
                  asignado: true,
                  tipo: TiposPersonero.MESA,
                  asignadoA: body.mesa
                }
              },
              { new: true }
            )
          }
        }
        // Si existia un personero de local antes de actualizar
        if (mesaIn.personero_local) {
          if (!body.personero_local) {
            await Personero.findByIdAndUpdate(
              mesaIn.personero_local,
              {
                $set: { asignado: false },
                $unset: { tipo: 1, asignadoA: 1 }
              },
              { new: true }
            )
            await Mesa.updateMany(
              { local: mesaOut?.local },
              {
                $unset: { personero_local: 1 }
              }
            )
          }
          if (body.personero_local && body.personero_local !== mesaIn.personero_local) {
            await Personero.findByIdAndUpdate(
              mesaIn.personero_local,
              {
                $set: { asignado: false },
                $unset: { tipo: 1, asignadoA: 1 }
              },
              { new: true }
            )
            await Personero.findByIdAndUpdate(
              body.personero_local,
              {
                $set: {
                  asignado: true,
                  tipo: TiposPersonero.LOCAL,
                  asignadoA: body.local
                }
              },
              { new: true }
            )
            await Mesa.updateMany(
              { local: mesaOut?.local },
              {
                $set: { personero_local: body.personero_local }
              }
            )
          }
        } else {
          if (body.personero_local) {
            await Personero.findByIdAndUpdate(
              body.personero_local,
              {
                $set: {
                  asignado: true,
                  tipo: TiposPersonero.LOCAL,
                  asignadoA: body.local
                }
              },
              { new: true }
            )
            await Mesa.updateMany(
              { local: mesaOut?.local },
              {
                $set: { personero_local: body.personero_local }
              }
            )
          }
        }
      }
    }

    // Guardamos el log del evento
    await saveLog({
      usuario: usuario._id,
      fuente: <string>source,
      origen: <string>origin,
      ip: <string>ip,
      dispositivo: <string>device,
      navegador: <string>browser,
      modulo: nombre_modulo,
      submodulo: nombre_submodulo,
      controller: nombre_controlador,
      funcion: 'update',
      descripcion: 'Actualizar una mesa de votación',
      evento: eventsLogs.update,
      data_in: JSON.stringify(mesaIn, null, 2),
      data_out: JSON.stringify(mesaOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos la mesa de votación actualizada
    const mesaResp: IMesa | null = await Mesa.findById(id, exclude_campos)

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => mesa actualizada en el módulo centros de votación
      globalThis.socketIO.to('intranet').emit('centros-votacion-mesa-actualizada')
    }

    // Retornamos la mesa de votación actualizada
    return res.json({
      status: true,
      msg: 'Se actualizó la mesa de votación correctamente',
      mesa: mesaResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Centros de Votación', 'Actualizando mesa de votación', id, error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo actualizar los datos de la mesa de votación'
    if (error instanceof Error.ValidationError) {
      // Si existe un error con validación de campo único
      if (error.errors) {
        Object.entries(error.errors).forEach((item, index) => {
          if (item[1] instanceof Error.ValidatorError && index === 0) {
            msg = `${item[1].path}: ${item[1].properties.message}`
          }
        })
      }
    }

    // Retornamos
    return res.status(404).json({
      status: false,
      msg
    })
  }
}

/*******************************************************************************************************/
// Eliminar una mesa de votación //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los parámetros de la petición
  const { headers, usuario, params } = req
  // Obtenemos el Id de la mesa de votación
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos la mesa de votación antes que se elimine
    const mesaResp: IMesa | null = await Mesa.findById(id, exclude_campos)

    // Si existe un personero de mesa
    if (mesaResp && mesaResp.personero_mesa) {
      await Personero.findByIdAndUpdate(
        mesaResp.personero_mesa,
        {
          $set: { asignado: false },
          $unset: { tipo: 1, asignadoA: 1 }
        },
        { new: true }
      )
    }
    // Si existe un personero de local
    if (mesaResp && mesaResp.personero_local) {
      const locales: IMesa[] = await Mesa.find({ local: mesaResp.local })
      if (locales.length === 1) {
        await Personero.findByIdAndUpdate(
          mesaResp.personero_local,
          {
            $set: { asignado: false },
            $unset: { tipo: 1, asignadoA: 1 }
          },
          { new: true }
        )
      }
    }

    // Intentamos realizar la búsqueda por id y removemos
    const mesaIn: IMesa | null = await Mesa.findByIdAndRemove(id)

    // Guardamos el log del evento
    await saveLog({
      usuario: usuario._id,
      fuente: <string>source,
      origen: <string>origin,
      ip: <string>ip,
      dispositivo: <string>device,
      navegador: <string>browser,
      modulo: nombre_modulo,
      submodulo: nombre_submodulo,
      controller: nombre_controlador,
      funcion: 'remove',
      descripcion: 'Remover una mesa de votación',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(mesaIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => mesa eliminada en el módulo centros de votación
      globalThis.socketIO.to('intranet').emit('centros-votacion-mesa-eliminada')
    }

    // Retornamos la mesa de votación eliminada
    return res.json({
      status: true,
      msg: 'Se eliminó la mesa de votación correctamente',
      mesa: mesaResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Centros de Votación', 'Eliminando mesa de votación', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar la mesa de votación'
    })
  }
}

/*******************************************************************************************************/
// Obtener los personeros disponibles //
/*******************************************************************************************************/
export const getPersoneros: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { query } = req

  try {
    // Definimos el query de los personeros
    const arrayQueryPersoneros: Array<IQueryPersoneros | { _id: string }> = []
    arrayQueryPersoneros.push({
      departamento: query.departamento as string,
      nombres: {
        $regex: `.*${(query.nombres as string).split(/\s/).join('.*')}.*`,
        $options: 'i'
      },
      apellidos: {
        $regex: `.*${(query.apellidos as string).split(/\s/).join('.*')}.*`,
        $options: 'i'
      },
      dni: {
        $regex: `.*${query.dni}.*`,
        $options: 'i'
      },
      asignado: false
    })
    if (query.personero_mesa) {
      arrayQueryPersoneros.push({ _id: query.personero_mesa as string })
    }
    if (query.personero_local) {
      arrayQueryPersoneros.push({ _id: query.personero_local as string })
    }
    const queryPersoneros = { $or: arrayQueryPersoneros }

    // Intentamos obtener el total de registros de personeros
    const totalRegistros: number = await Personero.find(queryPersoneros).count()

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

    // Intentamos realizar la búsqueda de todos los personeros paginados
    const list: Array<IPersonero> = await Personero.find(queryPersoneros, exclude_campos)
      .sort({ nombres: 'asc', apellidos: 'asc' })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de personeros
    return res.json({
      status: true,
      pagina: page,
      totalPaginas,
      registros: list.length,
      totalRegistros,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log(
      'Centros de Votación',
      'Mesas',
      'Obteniendo la lista de personeros disponibles',
      error
    )
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los personeros disponibles'
    })
  }
}

/*******************************************************************************************************/
// Función para crear la plantilla //
/*******************************************************************************************************/
export const createTemplate: Handler = async (req, res) => {
  // Leemos el usuario y el cuerpo de la petición
  const { usuario, body } = req

  try {
    // Obtenemos el departamento según sea el caso
    let dptoId: string
    if (usuario.rol.super) {
      const departamento: IDepartamento | null = await Departamento.findOne({
        codigo: body.departamento
      })
      dptoId = departamento?._id
    } else {
      dptoId = usuario.departamento?._id as string
    }

    // Creamos una nueva instancia de una clase del libro de trabajo.
    const wb = new excel.Workbook()

    // Añadimos las hojas de trabajo al libro de trabajo.
    const ws1 = wb.addWorksheet('Mesas y locales de votación')
    const ws2 = wb.addWorksheet('Personeros')

    // Creamos el estilo de la cabecera tabla
    const styleHead = wb.createStyle({
      font: {
        bold: true,
        size: 11
      },
      alignment: {
        horizontal: 'center',
        vertical: 'center',
        shrinkToFit: true,
        wrapText: true
      }
    })

    // Creamos el estilo de la celda de tabla
    const styleCell = wb.createStyle({
      alignment: {
        horizontal: 'center',
        vertical: 'center'
      }
    })

    // Creamos el estilo de la celda de tabla numérico
    const styleCellNumber = wb.createStyle({
      alignment: {
        horizontal: 'center',
        vertical: 'center'
      },
      numberFormat: '##0'
    })

    //==============================================================//
    // CONSTRUIMOS LA HOJA DE MESAS Y LOCALES DE VOTACIÓN           //
    //==============================================================//
    // Definimos los anchos las columnas
    ws1.column(1).setWidth(27)
    ws1.column(2).setWidth(36)
    ws1.column(3).setWidth(40)
    ws1.column(4).setWidth(36)
    ws1.column(5).setWidth(24)
    ws1.column(6).setWidth(22)
    ws1.column(7).setWidth(19)
    ws1.column(8).setWidth(27)
    ws1.column(9).setWidth(19)

    // Creamos los campos de la cabecera de la tabla
    ws1.cell(1, 1).string('Número de Mesa \n (código de 06 dígitos numéricos)').style(styleHead)
    ws1.cell(1, 2).string('Personero de Mesa \n (Elegir de la lista)').style(styleHead)
    ws1.cell(1, 3).string('Local de Votación \n (Nombre del local de votación)').style(styleHead)
    ws1.cell(1, 4).string('Personero de Local \n (Elegir de la lista)').style(styleHead)
    ws1.cell(1, 5).string('Departamento \n (Nombre del departamento)').style(styleHead)
    ws1.cell(1, 6).string('Provincia \n (Nombre de la provincia)').style(styleHead)
    ws1.cell(1, 7).string('Distrito \n (Nombre del distrito)').style(styleHead)
    ws1.cell(1, 8).string('Ubigeo \n (código de 06 dígitos numéricos)').style(styleHead)
    ws1.cell(1, 9).string('Votantes \n (cantidad numérica)').style(styleHead)

    if (body.tipo === 'new') {
      // Establecemos los estilos de las celdas
      for (let i = 2; i < 3000; i++) {
        ws1.cell(i, 1).style(styleCell)
        ws1.cell(i, 2).style(styleCell)
        ws1.cell(i, 3).style(styleCell)
        ws1.cell(i, 4).style(styleCell)
        ws1.cell(i, 5).style(styleCell)
        ws1.cell(i, 6).style(styleCell)
        ws1.cell(i, 7).style(styleCell)
        ws1.cell(i, 8).style(styleCell)
        ws1.cell(i, 9).style(styleCellNumber)
      }
    }

    if (body.tipo === 'update') {
      // Obtenemos las mesas sin personeros asignados
      const mesas: Array<IMesa> = await Mesa.find(
        {
          anho: usuario.anho,
          departamento: dptoId,
          $or: [{ personero_mesa: { $exists: false } }, { personero_local: { $exists: false } }]
        },
        exclude_campos
      )
        .sort({ ubigeo: 'asc', mesa: 'asc' })
        .populate('departamento', exclude_campos)
        .populate('provincia', exclude_campos)
        .populate('distrito', exclude_campos)
        .populate('personero_provincia', exclude_campos)
        .populate('personero_distrito', exclude_campos)
        .populate('personero_local', exclude_campos)
        .populate('personero_mesa', exclude_campos)
        .collation({ locale: 'es', numericOrdering: true })

      // Creamos las filas con el contenido
      const rowStart1 = 2
      const promisesMesas = mesas.map(async (row, index) => {
        ws1
          .cell(index + rowStart1, 1)
          .string(row.mesa)
          .style(styleCell)
        if (row.personero_mesa) {
          ws1
            .cell(index + rowStart1, 2)
            .string(
              `${row.personero_mesa.nombres.toUpperCase()} ${row.personero_mesa.apellidos.toUpperCase()} (${
                row.personero_mesa.dni
              })`
            )
            .style(styleCell)
        } else {
          ws1.cell(index + rowStart1, 2).style(styleCell)
        }
        ws1
          .cell(index + rowStart1, 3)
          .string(row.local)
          .style(styleCell)
        if (row.personero_local) {
          ws1
            .cell(index + rowStart1, 4)
            .string(
              `${row.personero_local.nombres.toUpperCase()} ${row.personero_local.apellidos.toUpperCase()} (${
                row.personero_local.dni
              })`
            )
            .style(styleCell)
        } else {
          ws1.cell(index + rowStart1, 4).style(styleCell)
        }
        ws1
          .cell(index + rowStart1, 5)
          .string(row.departamento?.nombre.toUpperCase())
          .style(styleCell)
        ws1
          .cell(index + rowStart1, 6)
          .string(row.provincia?.nombre.toUpperCase())
          .style(styleCell)
        ws1
          .cell(index + rowStart1, 7)
          .string(row.distrito?.nombre.toUpperCase())
          .style(styleCell)
        ws1
          .cell(index + rowStart1, 8)
          .string(row.ubigeo)
          .style(styleCell)
        if (row.votantes) {
          ws1
            .cell(index + rowStart1, 9)
            .number(row.votantes)
            .style(styleCellNumber)
        } else {
          ws1.cell(index + rowStart1, 9).style(styleCellNumber)
        }
      })
      await Promise.all(promisesMesas)
    }
    //==============================================================//
    // CONSTRUIMOS LA HOJA DE PERSONEROS DISPONIBLES v              //
    //==============================================================//
    // Definimos los anchos las columnas
    ws2.column(1).setWidth(60)

    // Creamos los campos de la cabecera de la tabla
    ws2.cell(1, 1).string('Personeros disponibles').style(styleHead)

    // Obtenemos los personeros disponibles
    const personeros: Array<IPersonero> = await Personero.find(
      { departamento: dptoId, asignado: false },
      exclude_campos
    ).sort({ nombres: 'asc', apellidos: 'asc' })

    // Creamos las filas con el contenido
    const rowStart2 = 2
    let rowFinish2 = 2
    const promisesPers = personeros.map(async (row, index) => {
      ws2
        .cell(index + rowStart2, 1)
        .string(`${row.nombres.toUpperCase()} ${row.apellidos.toUpperCase()} (${row.dni})`)
        .style(styleCell)
      rowFinish2 = index + rowStart2
    })
    await Promise.all(promisesPers)

    // Añadimos la validación y lista desplegable para Personeros
    ws1.addDataValidation({
      type: 'list',
      allowBlank: 1,
      sqref: `B2:B5000`,
      formulas: [`=Personeros!$A$${rowStart2}:$A$${rowFinish2}`]
    })
    ws1.addDataValidation({
      type: 'list',
      allowBlank: 1,
      sqref: `D2:D5000`,
      formulas: [`=Personeros!$A$${rowStart2}:$A$${rowFinish2}`]
    })

    // Definimos la carpeta de la plantilla
    const path = join(__dirname, '../../../uploads', 'centros-votacion', 'mesas')
    // Si no existe la carpeta la creamos
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true })
    }
    // Definimos la ruta del archivo
    const pathFile = join(path, `template_${body.tipo}.xlsx`)
    // Guardamos el documento
    await wb.write(pathFile)

    // Obtenemos el host
    const host = getHost()
    // Url del template excel
    const url = `${host}/uploads/centros-votacion/mesas/template_${body.tipo}.xlsx`

    // Devolvemos la url del template
    res.json({
      status: true,
      url
    })
  } catch (error) {
    console.log('Centros de Votación', 'Mesas', 'Creando plantilla de mesas', error)
    return res.status(400).json({
      status: false,
      msg: 'No se pudo crear la plantilla de mesas y locales votación'
    })
  }
}

/*******************************************************************************************************/
// Interface mensajes de errores //
/*******************************************************************************************************/
interface IMsgError {
  index: number
  msg: string
}

/*******************************************************************************************************/
// Procesar archivo excel de mesas de votación //
/*******************************************************************************************************/
export const importExcel: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, cuerpo y los archivos de la petición
  const { headers, usuario, body, files } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  // Si existe un archivo de excel se crea la ruta y se almacena
  if (files && Object.keys(files).length > 0 && files.file) {
    try {
      // Guardamos el archivo localmente para recorrerlo y obtenemos la ruta
      const pathFile: string = await storeFile(
        <UploadedFile>files.file,
        join('centros-votacion', 'mesas'),
        `temp_${body.tipo}`
      )

      // Obtenemos el departamento según sea el caso
      const codDpto: string =
        usuario && usuario.rol.super ? body.departamento : usuario.departamento?.codigo

      // Obtenemos las filas de la plantilla de excel
      const rows: Row[] = await xlsxFile(pathFile, { sheet: 1 })

      // Inicializamos el array de mensajes de error
      const msgError: IMsgError[] = []

      // Establecemos la fila de inicio
      const rowStart = 1

      // Establecemos el id de grupo de log
      const id_grupo = `${usuario._id}@${parseNewDate24H_()}`

      // Recorremos las filas para ver si hay errores
      const promises = rows.map(async (row, index) => {
        // Si el index es mayor o igual al fila de inicio
        if (index >= rowStart) {
          const msg = await validateFields(body.tipo, row, index, codDpto, usuario.anho as number)
          // Si pasó las validaciones
          if (msg === 'ok') {
            // Obtenemos los datos del departamento si existe
            const departamento: IDepartamento | null = await Departamento.findOne({
              codigo: `${row[7]}`.substring(0, 2)
            })
            // Obtenemos los datos de la provincia si existe
            const provincia: IProvincia | null = await Provincia.findOne({
              codigo: `${row[7]}`.substring(2, 4),
              departamento: `${row[7]}`.substring(0, 2)
            })
            // Obtenemos los datos del distrito si existe
            const distrito: IDistrito | null = await Distrito.findOne({
              codigo: `${row[7]}`.substring(4, 6),
              provincia: `${row[7]}`.substring(2, 4),
              departamento: `${row[7]}`.substring(0, 2)
            })

            // Si existe un personero de mesa
            let personeroMesa: IPersonero | null = null
            if (row[1] && `${row[1]}` !== '') {
              const row1Parts = `${row[1]}`.split('(')
              const dni1 = row1Parts[1].replace(')', '')
              if (dni1.length === 8) {
                personeroMesa = await Personero.findOne({
                  dni: dni1,
                  anho: usuario.anho as number
                })
              }
            }

            // Si existe un personero de local
            let personeroLocal: IPersonero | null = null
            if (row[3] && `${row[3]}` !== '') {
              const row3Parts = `${row[3]}`.split('(')
              const dni3 = row3Parts[1].replace(')', '')
              if (dni3.length === 8) {
                personeroLocal = await Personero.findOne({
                  dni: dni3,
                  anho: usuario.anho as number
                })
              }
            }

            if (body.tipo === 'new') {
              // Creamos el modelo de una nueva mesa de votación
              const newMesa: IMesa = new Mesa({
                mesa: `${row[0]}`,
                ...(personeroMesa && { personero_mesa: personeroMesa._id }),
                local: `${row[2]}`,
                ...(personeroLocal && { personero_local: personeroLocal._id }),
                departamento: departamento?._id,
                provincia: provincia?._id,
                distrito: distrito?._id,
                ubigeo: `${row[7]}`,
                ...(row[8] && { votantes: parseInt(`${row[8]}`, 10) }),
                anho: usuario.anho
              })

              // Intentamos guardar la nueva mesa de votación
              const mesaOut: IMesa = await newMesa.save()

              // Si existe un personero de mesa
              if (personeroMesa) {
                await Personero.findByIdAndUpdate(personeroMesa._id, {
                  $set: {
                    asignado: true,
                    tipo: TiposPersonero.MESA,
                    asignadoA: mesaOut.mesa
                  }
                })
              }

              // Si existe un personero de local
              if (personeroLocal) {
                await Personero.findByIdAndUpdate(personeroLocal._id, {
                  $set: {
                    asignado: true,
                    tipo: TiposPersonero.LOCAL,
                    asignadoA: mesaOut.local
                  }
                })
              }

              // Guardamos el log del evento
              await saveLog({
                usuario: usuario._id,
                fuente: <string>source,
                origen: <string>origin,
                ip: <string>ip,
                dispositivo: <string>device,
                navegador: <string>browser,
                modulo: nombre_modulo,
                submodulo: nombre_submodulo,
                controller: nombre_controlador,
                funcion: 'create',
                descripcion: 'Crear nueva mesa de votación por excel importado',
                evento: eventsLogs.create,
                data_in: '',
                data_out: JSON.stringify(mesaOut, null, 2),
                procesamiento: 'masivo',
                registros: 1,
                id_grupo
              })
            }
            if (body.tipo === 'update') {
              // Intentamos obtener la mesa de votación antes que se actualice
              const mesaIn: IMesa | null = await Mesa.findOne({
                mesa: `${row[0]}`,
                anho: usuario.anho
              })

              // Intentamos realizar la búsqueda por id y actualizamos
              const mesaOut: IMesa | null = await Mesa.findOneAndUpdate(
                { mesa: `${row[0]}`, anho: usuario.anho },
                {
                  $set: {
                    ...(personeroMesa && { personero_mesa: personeroMesa._id }),
                    local: `${row[2]}`,
                    ...(personeroLocal && {
                      personero_local: personeroLocal._id
                    }),
                    departamento: departamento?._id,
                    provincia: provincia?._id,
                    distrito: distrito?._id,
                    ubigeo: `${row[7]}`,
                    ...(row[8] && { votantes: parseInt(`${row[8]}`, 10) })
                  },
                  $unset: {
                    ...(!personeroMesa && {
                      personero_mesa: 1
                    }),
                    ...(!personeroLocal && {
                      personero_local: 1
                    })
                  }
                },
                { new: true }
              )

              if (mesaIn) {
                // Si existia un personero de mesa antes de actualizar
                if (mesaIn.personero_mesa) {
                  if (!personeroMesa) {
                    await Personero.findByIdAndUpdate(
                      mesaIn.personero_mesa,
                      {
                        $set: { asignado: false },
                        $unset: { tipo: 1, asignadoA: 1 }
                      },
                      { new: true }
                    )
                  }
                  if (personeroMesa && personeroMesa._id !== mesaIn.personero_mesa) {
                    await Personero.findByIdAndUpdate(
                      mesaIn.personero_mesa,
                      {
                        $set: { asignado: false },
                        $unset: { tipo: 1, asignadoA: 1 }
                      },
                      { new: true }
                    )
                    await Personero.findByIdAndUpdate(
                      personeroMesa._id,
                      {
                        $set: {
                          asignado: true,
                          tipo: TiposPersonero.MESA,
                          asignadoA: `${row[0]}`
                        }
                      },
                      { new: true }
                    )
                  }
                } else {
                  if (personeroMesa) {
                    await Personero.findByIdAndUpdate(
                      personeroMesa._id,
                      {
                        $set: {
                          asignado: true,
                          tipo: TiposPersonero.MESA,
                          asignadoA: `${row[0]}`
                        }
                      },
                      { new: true }
                    )
                  }
                }
                // Si existia un personero de local antes de actualizar
                if (mesaIn.personero_local) {
                  if (!personeroLocal) {
                    await Personero.findByIdAndUpdate(
                      mesaIn.personero_local,
                      {
                        $set: { asignado: false },
                        $unset: { tipo: 1, asignadoA: 1 }
                      },
                      { new: true }
                    )
                    await Mesa.updateMany(
                      { local: mesaOut?.local },
                      {
                        $unset: { personero_local: 1 }
                      }
                    )
                  }
                  if (personeroLocal && personeroLocal._id !== mesaIn.personero_local) {
                    await Personero.findByIdAndUpdate(
                      mesaIn.personero_local,
                      {
                        $set: { asignado: false },
                        $unset: { tipo: 1, asignadoA: 1 }
                      },
                      { new: true }
                    )
                    await Personero.findByIdAndUpdate(
                      personeroLocal._id,
                      {
                        $set: {
                          asignado: true,
                          tipo: TiposPersonero.LOCAL,
                          asignadoA: mesaOut?.local
                        }
                      },
                      { new: true }
                    )
                    await Mesa.updateMany(
                      { local: mesaOut?.local },
                      {
                        $set: { personero_local: personeroLocal._id }
                      }
                    )
                  }
                } else {
                  if (personeroLocal) {
                    await Personero.findByIdAndUpdate(
                      personeroLocal._id,
                      {
                        $set: {
                          asignado: true,
                          tipo: TiposPersonero.LOCAL,
                          asignadoA: mesaOut?.local
                        }
                      },
                      { new: true }
                    )
                    await Mesa.updateMany(
                      { local: mesaOut?.local },
                      {
                        $set: { personero_local: personeroLocal._id }
                      }
                    )
                  }
                }
              }
            }
          } else {
            // Guardamos el mensaje de error en el array de mensajes
            msgError.push({ index, msg })
          }
        }
        return null
      })
      await Promise.all(promises)

      // Si existe un servidor socketIO
      if (globalThis.socketIO) {
        // Emitimos el evento => mesas importadas en el módulo centros de votación
        globalThis.socketIO.to('intranet').emit('centros-votacion-mesas-importadas')
      }

      // Si hubo errores retornamos el detalle de los mensajes de error
      if (msgError.length > 0) {
        return res.json({
          status: true,
          errores: _.orderBy(msgError, ['index'], ['asc'])
        })
      } else {
        return res.json({
          status: true
        })
      }
    } catch (error) {
      // Mostramos el error en consola
      console.log('Centros de Votación', 'Importando Excel de Mesas de Votación', error)
      // Retornamos
      return res.status(404).json({
        status: false,
        msg: 'No se pudo subir el archivo excel de mesas de votación.'
      })
    }
  }
}

/*******************************************************************************************************/
// Función para validar los campos del excel de mesas de votación //
/*******************************************************************************************************/
const validateFields = async (
  tipo: string,
  row: Row,
  index: number,
  codigo: string,
  anho: number
) => {
  // Validamos que el número de mesa no esté vacio
  if (`${row[0]}` === '' || row[0] === null) {
    return `Fila ${index}: El campo número mesa no puede estar vacio`
  }
  // Validamos que el nombre del centro de votación no esté vacio
  if (`${row[2]}` === '' || row[2] === null) {
    return `Fila ${index}: El campo local no puede estar vacio`
  }
  // Validamos que el ubigeo no esté vacio
  if (`${row[7]}` === '' || row[7] === null) {
    return `Fila ${index}: El campo ubigeo no puede estar vacio`
  }
  // Validamos que el número de mesa tenga 6 dígitos
  if (`${row[0]}`.length !== 6) {
    return `Fila ${index}: El campo número de mesa debe tener 6 dígitos`
  }
  // Validamos que el ubigeo tenga 6 dígitos
  if (`${row[7]}`.length !== 6) {
    return `Fila ${index}: El campo ubigeo debe tener 6 dígitos`
  }
  // Validamos que el ubigeo corresponda al departamento del usuario
  if (`${row[7]}`.substring(0, 2) !== codigo) {
    return `Fila ${index}: El campo ubigeo debe comenzar con el código de departamento ${codigo}`
  }
  // Obtenemos los datos de la provincia si existe
  const provincia: IProvincia | null = await Provincia.findOne({
    codigo: `${row[7]}`.substring(2, 4),
    departamento: `${row[7]}`.substring(0, 2)
  })
  // Validamos que exista la provincia
  if (!provincia) {
    return `Fila ${index}: La provincia ${`${row[7]}`.substring(2, 4)} no existe`
  }
  // Obtenemos los datos del distrito si existe
  const distrito: IDistrito | null = await Distrito.findOne({
    codigo: `${row[7]}`.substring(4, 6),
    provincia: `${row[7]}`.substring(2, 4),
    departamento: `${row[7]}`.substring(0, 2)
  })
  // Validamos que exista el distrito
  if (!distrito) {
    return `Fila ${index}: El distrito ${`${row[7]}`.substring(4, 6)} no existe`
  }
  if (tipo === 'new') {
    // Si existe un número de mesa para el anho
    const mesaU: IMesa | null = await Mesa.findOne({
      mesa: `${row[0]}`,
      anho
    })
    if (mesaU) {
      return `Fila ${index}: El número de mesa ${row[0]}, ya se encuentra registrado para estas elecciones ${anho}`
    }
  }
  // Si pasó todas las validaciones
  return 'ok'
}

/*******************************************************************************************************/
// Obtener todos los locales de votación (resumido) //
/*******************************************************************************************************/
export const getLocales: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para los locales
    let queryLocales = {}

    // Añadimos el año
    queryLocales = { ...queryLocales, anho: usuario.anho }
    // Si es un superusuario
    if (usuario.rol.super) {
      // Filtramos por el query de departamento
      if (query.departamento && query.departamento !== 'todos') {
        queryLocales = {
          ...queryLocales,
          ubigeo: { $regex: `^${query.departamento}.*` }
        }
      }
      // Filtramos por el query de provincia
      if (query.provincia && query.provincia !== 'todos') {
        queryLocales = {
          ...queryLocales,
          ubigeo: { $regex: `^${query.departamento}${query.provincia}.*` }
        }
      }
      // Filtramos por el query de distrito
      if (query.distrito && query.distrito !== 'todos') {
        queryLocales = {
          ...queryLocales,
          ubigeo: {
            $regex: `^${query.departamento}${query.provincia}${query.distrito}.*`
          }
        }
      }
    } else {
      // Filtramos por los que no son superusuarios
      queryLocales = {
        ...queryLocales,
        ubigeo: { $regex: `^${usuario.departamento?.codigo}.*` }
      }
      // Filtramos por el query de provincia
      if (query.provincia && query.provincia !== 'todos') {
        queryLocales = {
          ...queryLocales,
          ubigeo: {
            $regex: `^${usuario.departamento?.codigo}${query.provincia}.*`
          }
        }
      }
      // Filtramos por el query de distrito
      if (query.distrito && query.distrito !== 'todos') {
        queryLocales = {
          ...queryLocales,
          ubigeo: {
            $regex: `^${usuario.departamento?.codigo}${query.provincia}${query.distrito}.*`
          }
        }
      }
    }

    // Intentamos realizar la búsqueda de todos los locales agrupados
    const list: Array<IMesa> = await Mesa.aggregate([
      { $match: queryLocales },
      { $group: { _id: '$local' } },
      { $sort: { _id: 1 } }
    ])

    // Retornamos la lista de locales
    return res.json({
      status: true,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Centros de Votación', 'Obteniendo la lista de locales de votación', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los locales de votación'
    })
  }
}

/*******************************************************************************************************/
// Obtener todas las mesas de votación (resumido) //
/*******************************************************************************************************/
export const getMesas: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para las mesas
    let queryMesas = {}

    // Añadimos el año
    queryMesas = { ...queryMesas, anho: usuario.anho }
    // Si es un superusuario
    if (usuario.rol.super) {
      // Filtramos por el query de departamento
      if (query.departamento && query.departamento !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: { $regex: `^${query.departamento}.*` }
        }
      }
      // Filtramos por el query de provincia
      if (query.provincia && query.provincia !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: { $regex: `^${query.departamento}${query.provincia}.*` }
        }
      }
      // Filtramos por el query de distrito
      if (query.distrito && query.distrito !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: {
            $regex: `^${query.departamento}${query.provincia}${query.distrito}.*`
          }
        }
      }
    } else {
      // Filtramos por los que no son superusuarios
      queryMesas = {
        ...queryMesas,
        ubigeo: { $regex: `^${usuario.departamento?.codigo}.*` }
      }
      // Filtramos por el query de provincia
      if (query.provincia && query.provincia !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: {
            $regex: `^${usuario.departamento?.codigo}${query.provincia}.*`
          }
        }
      }
      // Filtramos por el query de distrito
      if (query.distrito && query.distrito !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: {
            $regex: `^${usuario.departamento?.codigo}${query.provincia}${query.distrito}.*`
          }
        }
      }
    }
    // Filtramos por el query de local
    if (query.local && query.local !== 'todos') {
      queryMesas = {
        ...queryMesas,
        local: query.local
      }
    }

    // Intentamos realizar la búsqueda de todos las mesas agrupadas
    const list: Array<IMesa> = await Mesa.aggregate([
      { $match: queryMesas },
      { $group: { _id: '$mesa' } },
      { $sort: { _id: 1 } }
    ])

    // Retornamos la lista de mesas
    return res.json({
      status: true,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Centros de Votación', 'Obteniendo la lista de mesas de votación', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener las mesas de votación'
    })
  }
}
