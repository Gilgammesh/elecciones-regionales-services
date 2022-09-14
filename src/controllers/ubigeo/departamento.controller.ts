/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { Error } from 'mongoose'
import Departamento, { IDepartamento } from '../../models/ubigeo/departamento'
import { saveLog } from '../admin/log.controller'
import { parseNewDate24H_ } from '../../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../../helpers/pagination'
import { eventsLogs } from '../../models/admin/log'

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo = 'ubigeo'
const nombre_submodulo = 'departamento'
const nombre_controlador = 'departamento.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todos los departamentos //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el query de la petición
  const { query } = req

  try {
    // Intentamos obtener el total de registros de departamentos
    const totalRegistros: number = await Departamento.countDocuments()

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

    // Intentamos realizar la búsqueda de todos los departamentos paginados
    const list = await Departamento.find({}, exclude_campos)
      .sort({ ubigeo: 'asc' })
      .collation({ locale: 'es', numericOrdering: true })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de departamentos
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
    console.log('Ubigeo', 'Obteniendo los departamentos', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los departamentos'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de un departamento //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id del departamento
  const { id } = params

  try {
    // Intentamos realizar la búsqueda por id
    const departamento: IDepartamento | null = await Departamento.findById(id, exclude_campos)

    // Retornamos los datos del departamento encontrado
    return res.json({
      status: true,
      departamento
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Ubigeo', 'Obteniendo departamento', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos del departamento'
    })
  }
}

/*******************************************************************************************************/
// Crear un nuevo departamento //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y el cuerpo de la petición
  const { headers, usuario, body } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Creamos el ubigeo
    body.ubigeo = `${body.codigo}0000`

    // Creamos el modelo de un nuevo departamento
    const newDepartamento: IDepartamento = new Departamento(body)

    // Intentamos guardar el nuevo departamento
    const departamentoOut: IDepartamento = await newDepartamento.save()

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
      descripcion: 'Crear nuevo departamento',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(departamentoOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos el departamento creado
    const departamentoResp: IDepartamento | null = await Departamento.findById(
      departamentoOut._id,
      exclude_campos
    )

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => departamento creado en el módulo ubigeo
      globalThis.socketIO.to('intranet').emit('ubigeo-departamento-creado')
    }

    // Retornamos el departamento creado
    return res.json({
      status: true,
      msg: 'Se creó el departamento correctamente',
      departamento: departamentoResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Ubigeo', 'Crear nuevo departamento', error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo crear el departamento'
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
// Actualizar los datos de un departamento //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros y el cuerpo de la petición
  const { headers, usuario, params, body } = req
  // Obtenemos el Id del departamento
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener el departamento antes que se actualice
    const departamentoIn: IDepartamento | null = await Departamento.findById(id)

    // Creamos el ubigeo
    body.ubigeo = `${body.codigo}0000`

    // Intentamos realizar la búsqueda por id y actualizamos
    const departamentoOut: IDepartamento | null = await Departamento.findByIdAndUpdate(id, body, {
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
      descripcion: 'Actualizar un departamento',
      evento: eventsLogs.update,
      data_in: JSON.stringify(departamentoIn, null, 2),
      data_out: JSON.stringify(departamentoOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos el departamento actualizado
    const departamentoResp: IDepartamento | null = await Departamento.findById(id, exclude_campos)

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => departamento actualizado en el módulo ubigeo
      globalThis.socketIO.to('intranet').emit('ubigeo-departamento-actualizado')
    }

    // Retornamos el departamento actualizado
    return res.json({
      status: true,
      msg: 'Se actualizó el departamento correctamente',
      departamento: departamentoResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Ubigeo', 'Actualizando departamento', id, error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo actualizar el departamento'
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
// Eliminar un departamento //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los parámetros de la petición
  const { headers, usuario, params } = req
  // Obtenemos el Id del departamento
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos el departamento antes que se elimine
    const departamentoResp: IDepartamento | null = await Departamento.findById(id, exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const departamentoIn: IDepartamento | null = await Departamento.findByIdAndRemove(id)

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
      descripcion: 'Remover un departamento',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(departamentoIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => departamento eliminado en el módulo ubigeo
      globalThis.socketIO.to('intranet').emit('ubigeo-departamento-eliminado')
    }

    // Retornamos el departamento eliminado
    return res.json({
      status: true,
      msg: 'Se eliminó el departamento correctamente',
      departamento: departamentoResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Ubigeo', 'Eliminando departamento', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar el departamento'
    })
  }
}
