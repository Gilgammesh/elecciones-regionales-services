/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { Error } from 'mongoose'
import { UploadedFile } from 'express-fileupload'
import Organizacion, { IOrganizacion } from '../../models/organizacion_politica/organizacion'
import Gobernador from '../../models/organizacion_politica/gobernador'
import Consejero from '../../models/organizacion_politica/consejero'
import Alcalde from '../../models/organizacion_politica/alcalde'
import { saveLog } from '../admin/log.controller'
import { parseNewDate24H_ } from '../../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../../helpers/pagination'
import { eventsLogs } from '../../models/admin/log'
import { getPathUpload } from '../../helpers/host'
import { getUrlFile, removeFile, storeFile } from '../../helpers/upload'

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo = 'organizaciones_politicas'
const nombre_submodulo = 'organizacion'
const nombre_controlador = 'organizacion.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todas las organizaciones políticas //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para las organizaciones politicas
    let queryOrganizaciones = {}

    // Añadimos el año
    queryOrganizaciones = { ...queryOrganizaciones, anho: usuario.anho }

    if (query.nombre && query.nombre !== '') {
      queryOrganizaciones = {
        ...queryOrganizaciones,
        nombre: {
          $regex: `.*${`${query.nombre}`.trim().split(/\s/).join('.*')}.*`,
          $options: 'i'
        }
      }
    }

    // Intentamos obtener el total de registros de las organizaciones políticas
    const totalRegistros: number = await Organizacion.find(queryOrganizaciones).count()

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

    // Intentamos realizar la búsqueda de todas las organizaciones politicas paginadas
    const list: Array<IOrganizacion> = await Organizacion.find(queryOrganizaciones, exclude_campos)
      .sort(query.sort ? { [query.sort as string]: 'asc' } : { orden: 'asc' })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de organizaciones políticas
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
      'Organizaciones Políticas',
      'Obteniendo la lista de organizaciones políticas',
      error
    )
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener las organizaciones políticas'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de una organización política //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id de la organización política
  const { id } = params

  try {
    // Intentamos realizar la búsqueda por id
    const organizacion: IOrganizacion | null = await Organizacion.findById(id, exclude_campos)

    // Retornamos los datos de la organización política encontrada
    return res.json({
      status: true,
      organizacion
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log(
      'Organizaciones Políticas',
      'Obteniendo datos de la organización política',
      id,
      error
    )
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos de la organización política'
    })
  }
}

/*******************************************************************************************************/
// Crear una nueva organización política //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, el cuerpo y los archivos de la petición
  const { headers, usuario, body, files } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Verificamos si ya existe la organización política
    const organizacionU = await Organizacion.findOne({
      nombre: body.nombre,
      anho: usuario.anho
    })
    // Si existe una organización
    if (organizacionU) {
      return res.status(404).json({
        status: false,
        msg: `Ya existe la organización politica para estas elecciones ${usuario.anho}`
      })
    }

    // Establecemos el año
    body.anho = usuario.anho

    // Creamos el modelo de una nueva organización política
    const newOrganizacion: IOrganizacion = new Organizacion(body)

    // Path o ruta del archivo
    const path = 'organizaciones-politicas'
    const pathUrl = 'organizaciones-politicas'
    const pathDefault = `${getPathUpload()}/${pathUrl}/no-logo.png`

    // Si existe un archivo de imagen obtenemos la url pública
    if (files && Object.keys(files).length > 0 && files.file) {
      newOrganizacion.logo = getUrlFile(<UploadedFile>files.file, pathUrl, newOrganizacion._id)
    } else {
      newOrganizacion.logo = pathDefault
    }

    // Intentamos guardar la nueva organización política
    const organizacionOut: IOrganizacion = await newOrganizacion.save()

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
      descripcion: 'Crear nueva organización política',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(organizacionOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un archivo de imagen se crea la ruta y se almacena
    if (files && Object.keys(files).length > 0 && files.file) {
      await storeFile(<UploadedFile>files.file, path, newOrganizacion._id)
    }

    // Obtenemos la organización política creada
    const organizacionResp: IOrganizacion | null = await Organizacion.findById(
      organizacionOut._id,
      exclude_campos
    )

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => organización creada en el módulo organizaciones políticas
      globalThis.socketIO.to('intranet').emit('organizaciones-politicas-organizacion-creada')
    }

    // Retornamos la organización política creada
    return res.json({
      status: true,
      msg: 'Se creó la organización política correctamente',
      organizacion: organizacionResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Crear nueva organización política', error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo crear la organización política'
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
// Actualizar los datos de una organización política //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros, query, el cuerpo y los archivos de la petición
  const { headers, usuario, params, query, body, files } = req
  // Obtenemos el Id de la organización política
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener la organización política antes que se actualice
    const organizacionIn: IOrganizacion | null = await Organizacion.findById(id)

    if (organizacionIn && `${body.nombre}` !== `${organizacionIn?.nombre}`) {
      // Verificamos si ya existe la organización política
      const organizacionU = await Organizacion.findOne({
        nombre: body.nombre,
        anho: usuario.anho
      })
      // Si existe una organización
      if (organizacionU) {
        return res.status(404).json({
          status: false,
          msg: `Ya existe la organización politica para estas elecciones ${usuario.anho}`
        })
      }
    }

    // Path o ruta del archivo
    const path = 'organizaciones-politicas'
    const pathUrl = 'organizaciones-politicas'
    const pathDefault = `${getPathUpload()}/${pathUrl}/no-logo.png`

    // Si existe un archivo de imagen obtenemos la url pública
    if (files && Object.keys(files).length > 0 && files.file) {
      body.logo = getUrlFile(<UploadedFile>files.file, pathUrl, id)
    } else {
      // Si la organización tiene un logo
      if (organizacionIn?.logo) {
        // Si se removió el logo
        if (query.fileState === 'removed') {
          body.logo = pathDefault
        }
        // Caso contrario usamos el logo actual
        else {
          body.logo = organizacionIn.logo
        }
      }
      // Si no hay logo limpiamos la actual
      else {
        body.logo = pathDefault
      }
    }

    // Intentamos realizar la búsqueda por id y actualizamos
    const organizacionOut = await Organizacion.findByIdAndUpdate(
      id,
      { $set: body },
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
    )

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
      descripcion: 'Actualizar una organización política',
      evento: eventsLogs.update,
      data_in: JSON.stringify(organizacionIn, null, 2),
      data_out: JSON.stringify(organizacionOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un archivo de imagen se crea la ruta y se almacena
    if (files && Object.keys(files).length > 0 && files.file) {
      await storeFile(<UploadedFile>files.file, path, id)
    }

    // Obtenemos la organización política actualizada
    const organizacionResp: IOrganizacion | null = await Organizacion.findById(id, exclude_campos)

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => organización actualizada en el módulo organizaciones políticas
      globalThis.socketIO.to('intranet').emit('organizaciones-politicas-organizacion-actualizada')
    }

    // Retornamos la organización política actualizada
    return res.json({
      status: true,
      msg: 'Se actualizó la organización política correctamente',
      organizacion: organizacionResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Actualizando organización política', id, error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo actualizar los datos de la organización política'
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
// Eliminar una organización política //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los parámetros de la petición
  const { headers, usuario, params } = req
  // Obtenemos el Id de la organización política
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos la organización política antes que se elimine
    const organizacionResp: IOrganizacion | null = await Organizacion.findById(id, exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const organizacionIn: IOrganizacion | null = await Organizacion.findByIdAndRemove(id)
    // Removemos las dependencias gobernadores, consejeros y alcaldes
    await Gobernador.deleteMany({ organizacion: id })
    await Consejero.deleteMany({ organizacion: id })
    await Alcalde.deleteMany({ organizacion: id })

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
      descripcion: 'Remover una organización política',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(organizacionIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Path o ruta del archivo
    const path = 'organizaciones-politicas'
    const pathUrl = 'organizaciones-politicas'
    const pathDefault = `${getPathUpload()}/${pathUrl}/no-logo.png`

    // Si existe un logo
    if (organizacionIn && organizacionIn.logo && organizacionIn.logo !== pathDefault) {
      removeFile(organizacionIn.logo, path)
    }

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => organización eliminada en el módulo organizaciones políticas
      globalThis.socketIO.to('intranet').emit('organizaciones-politicas-organizacion-eliminada')
    }

    // Retornamos la organización política eliminada
    return res.json({
      status: true,
      msg: 'Se eliminó la organización política correctamente',
      organizacion: organizacionResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Eliminando organización política', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar la organización política'
    })
  }
}
