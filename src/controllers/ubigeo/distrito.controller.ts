/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { Error } from 'mongoose'
import Departamento, { IDepartamento } from '../../models/ubigeo/departamento'
import Provincia, { IProvincia } from '../../models/ubigeo/provincia'
import Distrito, { IDistrito } from '../../models/ubigeo/distrito'
import { saveLog } from '../admin/log.controller'
import { parseNewDate24H_ } from '../../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../../helpers/pagination'
import { eventsLogs } from '../../models/admin/log'

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo = 'ubigeo'
const nombre_submodulo = 'distrito'
const nombre_controlador = 'distrito.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todos los distritos //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el query de la petición
  const { query } = req

  try {
    // Definimos el query para el distrito
    let queryDistrito = {}
    // Si existe un query por departamento
    if (query.departamento && query.departamento !== '') {
      queryDistrito = { ...queryDistrito, departamento: query.departamento }
    }
    // Si existe un query por provincia
    if (query.provincia && query.provincia !== '') {
      queryDistrito = { ...queryDistrito, provincia: query.provincia }
    }

    // Intentamos obtener el total de registros de distritos de una provincia y departamento
    const totalRegistros: number = await Distrito.find(queryDistrito).count()

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

    // Intentamos realizar la búsqueda de todos los distritos de una provincia y departamento paginados
    const list = await Distrito.find(queryDistrito, exclude_campos)
      .sort({ ubigeo: 'asc' })
      .collation({ locale: 'es', numericOrdering: true })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de distritos
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
    console.log('Ubigeo', 'Obteniendo los distritos', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los distritos'
    })
  }
}

/*******************************************************************************************************/
// Obtener todos los distritos //
/*******************************************************************************************************/
export const getAll_: Handler = async (req, res) => {
  // Leemos el query de la petición
  const { query } = req

  try {
    // Definimos el query para el distrito
    let queryDistrito = {}

    // Obtenemos los datos del departamento si existe
    const departamento: IDepartamento | null = await Departamento.findById(query.departamento)
    // Si existe un departamento
    if (departamento) {
      queryDistrito = { ...queryDistrito, departamento: departamento.codigo }
    }

    // Obtenemos los datos de la provincia si existe si existe
    const provincia: IProvincia | null = await Provincia.findById(query.provincia)
    // Si existe una provincia
    if (provincia) {
      queryDistrito = { ...queryDistrito, provincia: provincia.codigo }
    }

    // Intentamos obtener el total de registros de distritos de una provincia y departamento
    const totalRegistros: number = await Distrito.find(queryDistrito).count()

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

    // Intentamos realizar la búsqueda de todos los distritos de una provincia y departamento paginados
    const list = await Distrito.find(queryDistrito, exclude_campos)
      .sort({ ubigeo: 'asc' })
      .collation({ locale: 'es', numericOrdering: true })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de distritos
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
    console.log('Ubigeo', 'Obteniendo los distritos', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los distritos'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de un distrito //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id del distrito
  const { id } = params

  try {
    // Intentamos realizar la búsqueda por id
    const distrito: IDistrito | null = await Distrito.findById(id, exclude_campos)

    // Retornamos los datos del distrito encontrado
    return res.json({
      status: true,
      distrito
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Ubigeo', 'Obteniendo distrito', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos del distrito'
    })
  }
}

/*******************************************************************************************************/
// Crear un nuevo distrito //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y el cuerpo de la petición
  const { headers, usuario, body } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Creamos el ubigeo
    body.ubigeo = `${body.departamento}${body.provincia}${body.codigo}`

    // Creamos el modelo de un nuevo distrito
    const newDistrito: IDistrito = new Distrito(body)

    // Intentamos guardar el nuevo distrito
    const distritoOut: IDistrito = await newDistrito.save()

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
      descripcion: 'Crear nuevo distrito',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(distritoOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos el distrito creado
    const distritoResp: IDistrito | null = await Distrito.findById(distritoOut._id, exclude_campos)

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => distrito creado en el módulo ubigeo
      globalThis.socketIO.to('intranet').emit('ubigeo-distrito-creado')
    }

    // Retornamos el distrito creado
    return res.json({
      status: true,
      msg: 'Se creó el distrito correctamente',
      distrito: distritoResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Ubigeo', 'Crear nuevo distrito', error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo crear el distrito'
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
// Actualizar los datos de un distrito //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros y el cuerpo de la petición
  const { headers, usuario, params, body } = req
  // Obtenemos el Id del distrito
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener el distrito antes que se actualice
    const distritoIn: IDistrito | null = await Distrito.findById(id)

    // Creamos el ubigeo
    body.ubigeo = `${body.departamento}${body.provincia}${body.codigo}`

    // Intentamos realizar la búsqueda por id y actualizamos
    const distritoOut: IDistrito | null = await Distrito.findByIdAndUpdate(id, body, {
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
      descripcion: 'Actualizar un distrito',
      evento: eventsLogs.update,
      data_in: JSON.stringify(distritoIn, null, 2),
      data_out: JSON.stringify(distritoOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos el distrito actualizado
    const distritoResp: IDistrito | null = await Distrito.findById(id, exclude_campos)

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => distrito actualizado en el módulo ubigeo
      globalThis.socketIO.to('intranet').emit('ubigeo-distrito-actualizado')
    }

    // Retornamos el distrito actualizado
    return res.json({
      status: true,
      msg: 'Se actualizó el distrito correctamente',
      distrito: distritoResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Ubigeo', 'Actualizando distrito', id, error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo actualizar el distrito'
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
// Eliminar un distrito //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los parámetros de la petición
  const { headers, usuario, params } = req
  // Obtenemos el Id del distrito
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos el distrito antes que se elimine
    const distritoResp: IDistrito | null = await Distrito.findById(id, exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const distritoIn: IDistrito | null = await Distrito.findByIdAndRemove(id)

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
      descripcion: 'Remover un distrito',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(distritoIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => distrito eliminado en el módulo ubigeo
      globalThis.socketIO.to('intranet').emit('ubigeo-distrito-eliminado')
    }

    // Retornamos el distrito eliminado
    return res.json({
      status: true,
      msg: 'Se eliminó el distrito correctamente',
      distrito: distritoResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Ubigeo', 'Eliminando distrito', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar el distrito'
    })
  }
}
