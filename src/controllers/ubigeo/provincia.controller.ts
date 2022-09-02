/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { Error } from 'mongoose'
import Departamento, { IDepartamento } from '../../models/ubigeo/departamento'
import Provincia, { IProvincia } from '../../models/ubigeo/provincia'
import { saveLog } from '../admin/log.controller'
import { parseNewDate24H_ } from '../../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../../helpers/pagination'
import { eventsLogs } from '../../models/admin/log'

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo = 'ubigeo'
const nombre_submodulo = 'provincia'
const nombre_controlador = 'provincia.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todas las provincias //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el query de la petición
  const { query } = req

  try {
    // Definimos el query para la provincia
    let queryProvincia = {}
    // Si existe un query por departament0
    if (query.departamento && query.departamento !== '') {
      queryProvincia = { ...queryProvincia, departamento: query.departamento }
    }

    // Intentamos obtener el total de registros de provincias de un departamento
    const totalRegistros: number = await Provincia.find(queryProvincia).count()

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

    // Intentamos realizar la búsqueda de todas las provincias de un departamento paginadas
    const list = await Provincia.find(queryProvincia, exclude_campos)
      .sort({ ubigeo: 'asc' })
      .collation({ locale: 'es', numericOrdering: true })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de provincias
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
    console.log('Ubigeo', 'Obteniendo las provincias', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener las provincias'
    })
  }
}

/*******************************************************************************************************/
// Obtener todas las provincias //
/*******************************************************************************************************/
export const getAll_: Handler = async (req, res) => {
  // Leemos el query de la petición
  const { query } = req

  try {
    // Definimos el query para la provincia
    let queryProvincia = {}

    // Obtenemos los datos del departamento si existe
    const departamento: IDepartamento | null = await Departamento.findById(query.departamento)
    // Si existe un departamento
    if (departamento) {
      queryProvincia = { ...queryProvincia, departamento: departamento.codigo }
    }

    // Intentamos obtener el total de registros de provincias de un departamento
    const totalRegistros: number = await Provincia.find(queryProvincia).count()

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

    // Intentamos realizar la búsqueda de todas las provincias de un departamento paginadas
    const list = await Provincia.find(queryProvincia, exclude_campos)
      .sort({ ubigeo: 'asc' })
      .collation({ locale: 'es', numericOrdering: true })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de provincias
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
    console.log('Ubigeo', 'Obteniendo las provincias', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener las provincias'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de una provincia //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id de la provincia
  const { id } = params

  try {
    // Intentamos realizar la búsqueda por id
    const provincia: IProvincia | null = await Provincia.findById(id, exclude_campos)

    // Retornamos los datos de la provincia encontrada
    return res.json({
      status: true,
      provincia
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Ubigeo', 'Obteniendo provincia', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos de la provincia'
    })
  }
}

/*******************************************************************************************************/
// Crear una nueva provincia //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y el cuerpo de la petición
  const { headers, usuario, body } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Creamos el ubigeo
    body.ubigeo = `${body.departamento}${body.codigo}00`

    // Creamos el modelo de una nueva provincia
    const newProvincia: IProvincia = new Provincia(body)

    // Intentamos guardar la nueva provincia
    const provinciaOut: IProvincia = await newProvincia.save()

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
      descripcion: 'Crear nueva provincia',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(provinciaOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos la provincia creada
    const provinciaResp: IProvincia | null = await Provincia.findById(
      provinciaOut._id,
      exclude_campos
    )

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => provincia creada en el módulo ubigeo, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('ubigeo-provincia-creada')
    }

    // Retornamos la provincia creada
    return res.json({
      status: true,
      msg: 'Se creó la provincia correctamente',
      provincia: provinciaResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Ubigeo', 'Crear nueva provincia', error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo crear la provincia'
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
// Actualizar los datos de una provincia //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros y el cuerpo de la petición
  const { headers, usuario, params, body } = req
  // Obtenemos el Id de la provincia
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener la provincia antes que se actualice
    const provinciaIn: IProvincia | null = await Provincia.findById(id)

    // Creamos el ubigeo
    body.ubigeo = `${body.departamento}${body.codigo}00`

    // Intentamos realizar la búsqueda por id y actualizamos
    const provinciaOut: IProvincia | null = await Provincia.findByIdAndUpdate(id, body, {
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
      descripcion: 'Actualizar una provincia',
      evento: eventsLogs.update,
      data_in: JSON.stringify(provinciaIn, null, 2),
      data_out: JSON.stringify(provinciaOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos la provincia actualizada
    const provinciaResp: IProvincia | null = await Provincia.findById(id, exclude_campos)

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => provincia actualizada en el módulo ubigeo, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('ubigeo-provincia-actualizada')
    }

    // Retornamos la provincia actualizada
    return res.json({
      status: true,
      msg: 'Se actualizó la provincia correctamente',
      provincia: provinciaResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Ubigeo', 'Actualizando provincia', id, error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo actualizar la provincia'
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
// Eliminar una provincia //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los parámetros de la petición
  const { headers, usuario, params } = req
  // Obtenemos el Id de la provincia
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos la provincia antes que se elimine
    const provinciaResp: IProvincia | null = await Provincia.findById(id, exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const provinciaIn: IProvincia | null = await Provincia.findByIdAndRemove(id)

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
      descripcion: 'Remover una provincia',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(provinciaIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => provincia eliminada en el módulo ubigeo, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('ubigeo-provincia-eliminada')
    }

    // Retornamos la provincia eliminada
    return res.json({
      status: true,
      msg: 'Se eliminó la provincia correctamente',
      provincia: provinciaResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Ubigeo', 'Eliminando provincia', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar la provincia'
    })
  }
}
