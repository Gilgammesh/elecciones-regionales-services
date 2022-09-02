/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import Rol, { IRol } from '../../models/admin/rol'
import { saveLog } from './log.controller'
import { parseNewDate24H_ } from '../../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../../helpers/pagination'
import { eventsLogs } from '../../models/admin/log'
import { Error } from 'mongoose'

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo = 'admin'
const nombre_submodulo = 'rol'
const nombre_controlador = 'rol.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todos los roles //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Intentamos obtener el total de registros de roles
    let totalRegistros: number
    // Si es un superusuario
    if (usuario.rol.super) {
      totalRegistros = await Rol.countDocuments()
    } else {
      totalRegistros = await Rol.find({ super: usuario.rol.super }).count()
    }

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

    // Intentamos realizar la búsqueda de todos los roles paginados
    let list: Array<IRol>
    // Si es un superusuario
    if (usuario.rol.super) {
      list = await Rol.find({}, exclude_campos)
        .sort({ prioridad: 'asc', codigo: 'asc', nombre: 'asc' })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
    } else {
      list = await Rol.find({ super: usuario.rol.super }, exclude_campos)
        .sort({ prioridad: 'asc', codigo: 'asc', nombre: 'asc' })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
    }

    // Retornamos la lista de roles
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
    console.log('Admin', 'Obteniendo los roles', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los roles'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de un rol //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id del rol
  const { id } = params

  try {
    // Intentamos realizar la búsqueda por id
    const rol: IRol | null = await Rol.findById(id, exclude_campos)

    // Retornamos los datos del rol encontrado
    return res.json({
      status: true,
      rol
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Admin', 'Obteniendo rol', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos del rol'
    })
  }
}

/*******************************************************************************************************/
// Crear un nuevo rol //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y el cuerpo de la petición
  const { headers, usuario, body } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Analizamos si el flag super esta en true
    if (body.super) {
      // Si es un superusuario
      if (usuario.rol.super) {
        body.super = true
      } else {
        // Retornamos
        return res.status(401).json({
          status: false,
          msg: 'Solo los super usuarios pueden crear roles de super usuario'
        })
      }
    } else {
      body.super = false
    }

    // Creamos el modelo de un nuevo rol
    const newRol: IRol = new Rol(body)

    // Intentamos guardar el nuevo rol
    const rolOut: IRol = await newRol.save()

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
      descripcion: 'Crear nuevo rol',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(rolOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos el rol creado
    const rolResp: IRol | null = await Rol.findById(rolOut._id, exclude_campos)

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => rol creado en el módulo administrador, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('admin-rol-creado')
    }

    // Retornamos el rol creado
    return res.json({
      status: true,
      msg: 'Se creó el rol correctamente',
      rol: rolResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Admin', 'Crear nuevo rol', error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo crear el rol'
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
// Actualizar los datos de un rol //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros y el cuerpo de la petición
  const { headers, usuario, params, body } = req
  // Obtenemos el Id del rol
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener el módulo antes que se actualice
    const rolIn: IRol | null = await Rol.findById(id)

    // Intentamos realizar la búsqueda por id y actualizamos
    const rolOut: IRol | null = await Rol.findByIdAndUpdate(id, body, {
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
      descripcion: 'Actualizar un rol',
      evento: eventsLogs.update,
      data_in: JSON.stringify(rolIn, null, 2),
      data_out: JSON.stringify(rolOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos el rol actualizado
    const rolResp: IRol | null = await Rol.findById(id, exclude_campos)

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => rol actualizado en el módulo administrador, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('admin-rol-actualizado')
    }

    // Retornamos el rol actualizado
    return res.json({
      status: true,
      msg: 'Se actualizó el rol correctamente',
      rol: rolResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Admin', 'Actualizando rol', id, error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo actualizar los datos del rol'
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
// Eliminar un rol //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los parámetros de la petición
  const { headers, usuario, params } = req
  // Obtenemos el Id del rol
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos el rol antes que se elimine
    const rolResp: IRol | null = await Rol.findById(id, exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const rolIn: IRol | null = await Rol.findByIdAndRemove(id)

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
      descripcion: 'Remover un rol',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(rolIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => rol eliminado en el módulo administrador, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('admin-rol-eliminado')
    }

    // Retornamos el rol eliminado
    return res.json({
      status: true,
      msg: 'Se eliminó el rol correctamente',
      rol: rolResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Admin', 'Eliminando rol', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar el rol'
    })
  }
}
