/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { Error } from 'mongoose'
import { join } from 'path'
import { UploadedFile } from 'express-fileupload'
import Consejero, { IConsejero } from '../../models/organizacion_politica/consejero'
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
const nombre_submodulo = 'consejero'
const nombre_controlador = 'consejero.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todos los consejeros de una organización política //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para los consejeros
    let queryConsejeroes = {}

    // Si existe un query de organizacion politica
    if (query.organizacion) {
      queryConsejeroes = {
        ...queryConsejeroes,
        organizacion: query.organizacion
      }
    }

    // Filtramos por el query de departamento
    if (query.departamento && query.departamento !== 'todos') {
      if (usuario.rol.super) {
        queryConsejeroes = {
          ...queryConsejeroes,
          departamento: query.departamento
        }
      } else {
        queryConsejeroes = {
          ...queryConsejeroes,
          departamento: usuario.departamento?._id
        }
      }
    }

    // Filtramos por el query de provincia
    if (query.provincia && query.provincia !== 'todos') {
      queryConsejeroes = {
        ...queryConsejeroes,
        provincia: query.provincia
      }
    }

    // Intentamos obtener el total de registros de los consejeros
    const totalRegistros: number = await Consejero.find(queryConsejeroes).count()

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

    // Intentamos realizar la búsqueda de todos los consejeros paginados
    const list: Array<IConsejero> = await Consejero.find(queryConsejeroes, exclude_campos)
      .sort({
        provincia: 'asc',
        numero: 'asc',
        nombres: 'asc',
        apellidos: 'asc'
      })
      .populate('departamento', exclude_campos)
      .populate('provincia', exclude_campos)
      .populate('organizacion', exclude_campos)
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de consejeros
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
    console.log('Organizaciones Políticas', 'Obteniendo la lista de consejeros', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los consejeros'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de un consejero de una organización política //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id del consejero
  const { id } = params

  try {
    // Intentamos realizar la búsqueda por id
    const consejero: IConsejero | null = await Consejero.findById(id, exclude_campos)
      .populate('departamento', exclude_campos)
      .populate('provincia', exclude_campos)
      .populate('organizacion', exclude_campos)

    // Retornamos los datos del consejero
    return res.json({
      status: true,
      consejero
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Obteniendo datos del consejero', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos del consejero'
    })
  }
}

/*******************************************************************************************************/
// Crear un nuevo consejero de un organización política //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, el cuerpo y los archivos de la petición
  const { headers, usuario, body, files } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Verificamos si ya existe el consejero
    const consejeroU = await Consejero.findOne({
      dni: body.dni,
      organizacion: body.organizacion
    })
    // Si existe un consejero
    if (consejeroU) {
      return res.status(404).json({
        status: false,
        msg: `Ya existe el consejero para esta organización política`
      })
    }

    // Creamos el modelo de un nuevo consejero
    const newConsejero: IConsejero = new Consejero({
      nombres: body.nombres,
      apellidos: body.apellidos,
      dni: body.dni,
      numero: parseInt(body.numero, 10),
      departamento: body.departamento,
      provincia: body.provincia,
      organizacion: body.organizacion
    })

    // Path o ruta del archivo
    const path = join('organizaciones-politicas', 'consejeros')
    const pathUrl = 'organizaciones-politicas/consejeros'
    const pathDefault = `${getPathUpload()}/${pathUrl}/no-foto.png`

    // Si existe un archivo de imagen obtenemos la url pública
    if (files && Object.keys(files).length > 0 && files.file) {
      newConsejero.foto = getUrlFile(<UploadedFile>files.file, pathUrl, newConsejero._id)
    } else {
      newConsejero.foto = pathDefault
    }

    // Intentamos guardar el nuevo consejero
    const consejeroOut: IConsejero = await newConsejero.save()

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
      descripcion: 'Crear nuevo consejero de una organización política',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(consejeroOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un archivo de imagen se crea la ruta y se almacena
    if (files && Object.keys(files).length > 0 && files.file) {
      await storeFile(<UploadedFile>files.file, path, newConsejero._id)
    }

    // Obtenemos el consejero creado
    const consejeroResp: IConsejero | null = await Consejero.findById(
      consejeroOut._id,
      exclude_campos
    )

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => consejero creado en el módulo organizaciones políticas
      globalThis.socketIO.to('intranet').emit('organizaciones-politicas-consejero-creado')
    }

    // Retornamos el consejero creado
    return res.json({
      status: true,
      msg: 'Se creó el consejero correctamente',
      consejero: consejeroResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Crear nuevo consejero', error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo crear el consejero'
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
// Actualizar los datos de un consejero de una organización política //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros, query, el cuerpo y los archivos de la petición
  const { headers, usuario, params, body, files } = req
  // Obtenemos el Id del consejero
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener el consejero antes que se actualice
    const consejeroIn: IConsejero | null = await Consejero.findById(id)

    // Casteamos el numero de consejero a entero
    if (body.numero) {
      body.numero = parseInt(body.numero, 10)
    }

    // Path o ruta del archivo
    const path = join('organizaciones-politicas', 'consejeros')
    const pathUrl = 'organizaciones-politicas/consejeros'
    const pathDefault = `${getPathUpload()}/${pathUrl}/no-foto.png`

    // Si existe un archivo de imagen obtenemos la url pública
    if (files && Object.keys(files).length > 0 && files.file) {
      body.foto = getUrlFile(<UploadedFile>files.file, pathUrl, id)
    } else {
      body.foto = pathDefault
    }

    // Intentamos realizar la búsqueda por id y actualizamos
    const consejeroOut = await Consejero.findByIdAndUpdate(
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
      descripcion: 'Actualizar un consejero de una organización política',
      evento: eventsLogs.update,
      data_in: JSON.stringify(consejeroIn, null, 2),
      data_out: JSON.stringify(consejeroOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un archivo de imagen se crea la ruta y se almacena
    if (files && Object.keys(files).length > 0 && files.file) {
      await storeFile(<UploadedFile>files.file, path, id)
    }

    // Obtenemos el consejero actualizado
    const consejeroResp: IConsejero | null = await Consejero.findById(id, exclude_campos)

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => consejero actualizado en el módulo organizaciones políticas
      globalThis.socketIO.to('intranet').emit('organizaciones-politicas-consejero-actualizado')
    }

    // Retornamos el consejero actualizado
    return res.json({
      status: true,
      msg: 'Se actualizó el consejero correctamente',
      consejero: consejeroResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Actualizando consejero', id, error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo actualizar los datos del consejero'
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
// Eliminar un consejero de una organización política //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los parámetros de la petición
  const { headers, usuario, params } = req
  // Obtenemos el Id del consejero
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos el consejero antes que se elimine
    const consejeroResp: IConsejero | null = await Consejero.findById(id, exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const consejeroIn: IConsejero | null = await Consejero.findByIdAndRemove(id)

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
      descripcion: 'Remover un consejero de una organización política',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(consejeroIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Path o ruta del archivo
    const path = join('organizaciones-politicas', 'consejeros')
    const pathUrl = 'organizaciones-politicas/consejeros'
    const pathDefault = `${getPathUpload()}/${pathUrl}/no-foto.png`

    // Si existe una foto
    if (consejeroIn && consejeroIn.foto && consejeroIn.foto !== pathDefault) {
      removeFile(consejeroIn.foto, path)
    }

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => consejero eliminado en el módulo organizaciones políticas
      globalThis.socketIO.to('intranet').emit('organizaciones-politicas-consejero-eliminado')
    }

    // Retornamos el consejero eliminado
    return res.json({
      status: true,
      msg: 'Se eliminó el consejero correctamente',
      consejero: consejeroResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Eliminando consejero', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar el consejero'
    })
  }
}
