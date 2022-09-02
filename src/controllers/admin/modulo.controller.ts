/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import Modulo, { IModulo } from '../../models/admin/modulo'
import { saveLog } from './log.controller'
import { parseNewDate24H_ } from '../../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../../helpers/pagination'
import { eventsLogs } from '../../models/admin/log'
import { Error } from 'mongoose'

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo = 'admin'
const nombre_submodulo = 'modulo'
const nombre_controlador = 'modulo.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todos los módulos //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el query de la petición
  const { query } = req

  try {
    // Intentamos obtener el total de registros de módulos
    const totalRegistros: number = await Modulo.countDocuments()

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

    // Intentamos realizar la búsqueda de todos los módulos paginados
    const list: Array<IModulo> = await Modulo.find({}, exclude_campos)
      .sort({ orden: 'asc' })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de módulos
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
    console.log('Admin', 'Obteniendo los módulos', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los módulos'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de un módulo //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id del módulo
  const { id } = params

  try {
    // Intentamos realizar la búsqueda por id
    const modulo: IModulo | null = await Modulo.findById(id, exclude_campos)

    // Retornamos los datos del módulo encontrado
    return res.json({
      status: true,
      modulo
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Admin', 'Obteniendo módulo', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos del módulo'
    })
  }
}

/*******************************************************************************************************/
// Crear un nuevo módulo //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y el cuerpo de la petición
  const { headers, usuario, body } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  // Creamos el modelo de un nuevo módulo
  const newModulo: IModulo = new Modulo(body)

  try {
    // Intentamos guardar el nuevo módulo
    const moduloOut: IModulo = await newModulo.save()

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
      descripcion: 'Crear nueva módulo',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(moduloOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos el módulo creado
    const moduloResp: IModulo | null = await Modulo.findById(moduloOut._id, exclude_campos)

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => módulo creado en el módulo administrador, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('admin-modulo-creado')
    }

    // Retornamos el módulo creado
    return res.json({
      status: true,
      msg: 'Se creó el módulo correctamente',
      modulo: moduloResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Admin', 'Crear nuevo módulo', error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo crear el módulo'
    // Si existe un error con validación de campo único
    if (error instanceof Error.ValidationError) {
      // Si existe un error con validación de campo único
      if (error.errors) {
        Object.entries(error.errors).forEach((item, index) => {
          if (item instanceof Error.ValidatorError && index === 0) {
            msg = `${item.path}: ${item.properties.message}`
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
// Actualizar los datos de un módulo //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros y el cuerpo de la petición
  const { headers, usuario, params, body } = req
  // Obtenemos el Id del módulo
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  // Si el tipo es item no tiene hijos
  if (body?.type === 'item') {
    body.children = undefined
  }
  // Si el tipo es collapse no tiene ruta
  if (body?.type === 'collapse') {
    body.url = undefined
  }

  try {
    // Intentamos obtener el módulo antes que se actualice
    const moduloIn: IModulo | null = await Modulo.findById(id)

    // Intentamos realizar la búsqueda por id y actualizamos
    const moduloOut: IModulo | null = await Modulo.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
      context: 'query'
    })

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
      descripcion: 'Actualizar un módulo',
      evento: eventsLogs.update,
      data_in: JSON.stringify(moduloIn, null, 2),
      data_out: JSON.stringify(moduloOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos el módulo actualizado
    const moduloResp: IModulo | null = await Modulo.findById(id, exclude_campos)

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => módulo actualizado en el módulo administrador, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('admin-modulo-actualizado')
    }

    // Retornamos el módulo actualizado
    return res.json({
      status: true,
      msg: 'Se actualizó el módulo correctamente',
      modulo: moduloResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Admin', 'Actualizando módulo', id, error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo actualizar los datos del módulo'
    // Si existe un error con validación de campo único
    if (error instanceof Error.ValidationError) {
      // Si existe un error con validación de campo único
      if (error.errors) {
        Object.entries(error.errors).forEach((item, index) => {
          if (item instanceof Error.ValidatorError && index === 0) {
            msg = `${item.path}: ${item.properties.message}`
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
// Eliminar un módulo //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los parámetros de la petición
  const { headers, usuario, params } = req
  // Obtenemos el Id del módulo
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos el módulo antes que se elimine
    const moduloResp: IModulo | null = await Modulo.findById(id, exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const moduloIn: IModulo | null = await Modulo.findByIdAndRemove(id)

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
      descripcion: 'Remover un módulo',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(moduloIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => módulo eliminado en el módulo administrador, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('admin-modulo-eliminado')
    }

    // Retornamos el módulo eliminado
    return res.json({
      status: true,
      msg: 'Se eliminó el módulo correctamente',
      modulo: moduloResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Admin', 'Eliminando módulo', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar el módulo'
    })
  }
}
