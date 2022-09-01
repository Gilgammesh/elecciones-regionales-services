/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { Error } from 'mongoose'
import { Socket } from 'socket.io'
import Accion, { IAccion } from '../../models/admin/accion'
import { saveLog } from './log.controller'
import { parseNewDate24H_ } from '../../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../../helpers/pagination'
import { eventsLogs } from '../../models/admin/log'

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo: string = 'admin'
const nombre_submodulo: string = 'accion'
const nombre_controlador: string = 'accion.controller'
const exclude_campos: string = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todas las acciones //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el query de la petición
  const { query } = req

  try {
    // Intentamos obtener el total de registros de acciones
    const totalRegistros: number = await Accion.countDocuments()

    // Obtenemos el número de registros por página y hacemos las validaciones
    const validatePageSize: any = await getPageSize(pagination.pageSize, query.pageSize)
    if (!validatePageSize.status) {
      return res.status(404).json({
        status: validatePageSize.status,
        msg: validatePageSize.msg
      })
    }
    const pageSize = validatePageSize.size

    // Obtenemos el número total de páginas
    const totalPaginas: number = getTotalPages(totalRegistros, pageSize)

    // Obtenemos el número de página y hacemos las validaciones
    const validatePage: any = await getPage(pagination.page, query.page, totalPaginas)
    if (!validatePage.status) {
      return res.status(404).json({
        status: validatePage.status,
        msg: validatePage.msg
      })
    }
    const page = validatePage.page

    // Intentamos realizar la búsqueda de todas las acciones paginadas
    const list = await Accion.find({}, exclude_campos)
      .sort({ nombre: 'asc' })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de acciones
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
    console.log('Admin', 'Obteniendo las acciones', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener las acciones'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de una acción //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id de la acción
  const { id } = params

  try {
    // Intentamos realizar la búsqueda por id
    const accion: IAccion | null = await Accion.findById(id, exclude_campos)

    // Retornamos los datos de la acción encontrada
    return res.json({
      status: true,
      accion
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Admin', 'Obteniendo acción', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos de la acción'
    })
  }
}

/*******************************************************************************************************/
// Crear una nueva acción //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y el cuerpo de la petición
  const { headers, usuario, body } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  // Creamos el modelo de una nueva acción
  const newAccion: IAccion = new Accion(body)

  try {
    // Intentamos guardar la nueva acción
    const accionOut: IAccion = await newAccion.save()

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
      descripcion: 'Crear nueva acción',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(accionOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos la accion creada
    const accionResp: IAccion | null = await Accion.findById(accionOut._id, exclude_campos)

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => acción creada en el módulo administrador, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('admin-accion-creada')
    }

    // Retornamos la acción creada
    return res.json({
      status: true,
      msg: 'Se creó la acción correctamente',
      accion: accionResp
    })
  } catch (error: Error | any) {
    // Mostramos el error en consola
    console.log('Admin', 'Crear nueva acción', error)

    // Inicializamos el mensaje de error
    let msg: string = 'No se pudo crear la acción'
    // Si existe un error con validación de campo único
    if (error?.errors) {
      // Obtenemos el array de errores
      const array: string[] = Object.keys(error.errors)
      // Construimos el mensaje de error de acuerdo al campo
      msg = `${error.errors[array[0]].path}: ${error.errors[array[0]].properties.message}`
    }

    // Retornamos
    return res.status(404).json({
      status: false,
      msg
    })
  }
}

/*******************************************************************************************************/
// Actualizar los datos de una acción //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros y el cuerpo de la petición
  const { headers, usuario, params, body } = req
  // Obtenemos el Id de la acción
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener la acción antes que se actualice
    const accionIn: IAccion | null = await Accion.findById(id)

    // Intentamos realizar la búsqueda por id y actualizamos
    const accionOut: IAccion | null = await Accion.findByIdAndUpdate(id, body, {
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
      descripcion: 'Actualizar una acción',
      evento: eventsLogs.update,
      data_in: JSON.stringify(accionIn, null, 2),
      data_out: JSON.stringify(accionOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos la accion actualizada
    const accionResp: IAccion | null = await Accion.findById(id, exclude_campos)

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => acción actualizada en el módulo administrador, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('admin-accion-actualizada')
    }

    // Retornamos la acción actualizada
    return res.json({
      status: true,
      msg: 'Se actualizó la acción correctamente',
      accion: accionResp
    })
  } catch (error: Error | any) {
    // Mostramos el error en consola
    console.log('Admin', 'Actualizando acción', id, error)

    // Inicializamos el mensaje de error
    let msg: string = 'No se pudo actualizar la acción'
    // Si existe un error con validación de campo único
    if (error?.errors) {
      // Obtenemos el array de errores
      const array: string[] = Object.keys(error.errors)
      // Construimos el mensaje de error de acuerdo al campo
      msg = `${error.errors[array[0]].path}: ${error.errors[array[0]].properties.message}`
    }

    // Retornamos
    return res.status(404).json({
      status: false,
      msg
    })
  }
}

/*******************************************************************************************************/
// Eliminar una acción //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los parámetros de la petición
  const { headers, usuario, params } = req
  // Obtenemos el Id de la acción
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos la accion antes que se elimine
    const accionResp: IAccion | null = await Accion.findById(id, exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const accionIn: IAccion | null = await Accion.findByIdAndRemove(id)

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
      descripcion: 'Remover una acción',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(accionIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => acción eliminada en el módulo administrador, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('admin-accion-eliminada')
    }

    // Retornamos la acción eliminada
    return res.json({
      status: true,
      msg: 'Se eliminó la acción correctamente',
      accion: accionResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Admin', 'Eliminando acción', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar la acción'
    })
  }
}
