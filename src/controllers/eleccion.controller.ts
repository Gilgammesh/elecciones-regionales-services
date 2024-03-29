/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { Error } from 'mongoose'
import Eleccion, { IEleccion } from '../models/eleccion'
import moment from 'moment-timezone'
import { saveLog } from './admin/log.controller'
import { parseNewDate24H_ } from '../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../helpers/pagination'
import { eventsLogs } from '../models/admin/log'
import { timeZone } from '../configs'

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo = 'elecciones'
const nombre_submodulo = ''
const nombre_controlador = 'eleccion.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todas las elecciones //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el query de la petición
  const { query } = req

  try {
    // Intentamos obtener el total de registros de elecciones
    const totalRegistros: number = await Eleccion.find({}).count()

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

    // Intentamos realizar la búsqueda de todas las elecciones paginadas
    const list: Array<IEleccion> = await Eleccion.find({}, exclude_campos)
      .sort({ anho: 'asc' })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de elecciones
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
    console.log('Eleccions', 'Obteniendo la lista de elecciones', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los elecciones'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de una eleccion //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id de la eleccion
  const { id } = params
  try {
    // Intentamos realizar la búsqueda por id
    const eleccion: IEleccion | null = await Eleccion.findById(id, exclude_campos)

    // Retornamos los datos de la eleccion encontrada
    return res.json({
      status: true,
      eleccion
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Admin', 'Obteniendo datos de eleccion', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos de la eleccion'
    })
  }
}

/*******************************************************************************************************/
// Crear una nueva eleccion //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y el cuerpo de la petición
  const { headers, usuario, body } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del eleccion
  const { source, origin, ip, device, browser } = headers

  try {
    // Casteamos la fecha de elección
    const date = moment(body.fecha).tz(timeZone)
    const dayNro = date.format('DD')
    const month = date.format('MM')
    const year = date.format('YYYY')
    const fecha = `${dayNro}/${month}/${year}`
    // Reemplazamos por el valor casteado
    body.fecha = fecha

    // Si el año es el actual
    if (body.actual) {
      // Cambiamos el estado de los demás a false
      await Eleccion.updateMany({}, { actual: false })
    } else {
      const elecciones = await Eleccion.find({ actual: true })
      // Si no existe ningin año como actual
      if (elecciones.length === 0) {
        // Retornamos
        return res.status(400).json({
          status: false,
          msg: 'Debe seleccionar un año como el actual'
        })
      }
    }

    // Creamos el modelo de una nueva eleccion
    const newEleccion: IEleccion = new Eleccion(body)

    // Intentamos guardar la nueva eleccion
    const eleccionOut: IEleccion = await newEleccion.save()

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
      descripcion: 'Crear nueva eleccion',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(eleccionOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos la eleccion creada
    const eleccionResp: IEleccion | null = await Eleccion.findById(eleccionOut._id, exclude_campos)

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => eleccion creada en el módulo elecciones
      globalThis.socketIO.to('intranet').emit('eleccion-creada')
    }

    // Retornamos la eleccion creada
    return res.json({
      status: true,
      msg: 'Se creó la eleccion correctamente',
      eleccion: eleccionResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Eleccions', 'Crear nueva eleccion', error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo crear la eleccion'
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
// Actualizar los datos de una eleccion //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros y el cuerpo de la petición
  const { headers, usuario, params, body } = req
  // Obtenemos el Id de la eleccion
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del eleccion
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener la eleccion antes que se actualice
    const eleccionIn: IEleccion | null = await Eleccion.findById(id)

    // Casteamos la fecha de elección
    const date = moment(body.fecha).tz(timeZone)
    const dayNro = date.format('DD')
    const month = date.format('MM')
    const year = date.format('YYYY')
    const fecha = `${dayNro}/${month}/${year}`
    // Reemplazamos por el valor casteado
    body.fecha = fecha

    // Si el año es el actual
    if (body.actual) {
      // Cambiamos el estado de los demás a false
      await Eleccion.updateMany({}, { actual: false })
    } else {
      const elecciones = await Eleccion.find({ actual: true })
      // Si existe un año como actual y es igual al que se quiere actualizar
      if (elecciones.length === 1 && elecciones[0].anho === eleccionIn?.anho) {
        // Retornamos
        return res.status(400).json({
          status: false,
          msg: 'No puede deseleccionar el año actual'
        })
      }
    }

    // Intentamos realizar la búsqueda por id y actualizamos
    const eleccionOut = await Eleccion.findByIdAndUpdate(id, body, {
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
      descripcion: 'Actualizar una eleccion',
      evento: eventsLogs.update,
      data_in: JSON.stringify(eleccionIn, null, 2),
      data_out: JSON.stringify(eleccionOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos la eleccion actualizada
    const eleccionResp: IEleccion | null = await Eleccion.findById(id, exclude_campos)

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => eleccion actualizada en el módulo elecciones
      globalThis.socketIO.to('intranet').emit('eleccion-actualizada')
    }

    // Retornamos la eleccion actualizada
    return res.json({
      status: true,
      msg: 'Se actualizó la eleccion correctamente',
      eleccion: eleccionResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Eleccions', 'Actualizando eleccion', id, error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo actualizar los datos de la eleccion'
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
// Eliminar una eleccion //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los parámetros de la petición
  const { headers, usuario, params } = req
  // Obtenemos el Id de la eleccion
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del eleccion
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos la eleccion antes que se elimine
    const eleccionResp: IEleccion | null = await Eleccion.findById(id, exclude_campos)

    const elecciones = await Eleccion.find({ actual: true })
    // Si existe un año como actual y es igual al que se quiere actualizar
    if (elecciones.length === 1 && elecciones[0].anho === eleccionResp?.anho) {
      // Retornamos
      return res.status(400).json({
        status: false,
        msg: 'No puede eliminar el año actual'
      })
    }

    // Intentamos realizar la búsqueda por id y removemos
    const eleccionIn: IEleccion | null = await Eleccion.findByIdAndRemove(id)

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
      descripcion: 'Remover una eleccion',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(eleccionIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => eleccion eliminada en el módulo elecciones
      globalThis.socketIO.to('intranet').emit('eleccion-eliminada')
    }

    // Retornamos la eleccion eliminada
    return res.json({
      status: true,
      msg: 'Se eliminó la eleccion correctamente',
      eleccion: eleccionResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Eleccions', 'Eliminando eleccion', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar la eleccion'
    })
  }
}
