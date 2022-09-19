/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { Error } from 'mongoose'
import { join } from 'path'
import { UploadedFile } from 'express-fileupload'
import Gobernador, { IGobernador } from '../../models/organizacion_politica/gobernador'
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
const nombre_submodulo = 'gobernador'
const nombre_controlador = 'gobernador.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todos los gobernadores de una organización política //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para los gobernadores
    let queryGobernadores = {}

    // Filtramos por el query de departamento
    if (query.departamento && query.departamento !== 'todos') {
      if (usuario.rol.super) {
        queryGobernadores = {
          ...queryGobernadores,
          departamento: query.departamento
        }
      } else {
        queryGobernadores = {
          ...queryGobernadores,
          departamento: usuario.departamento?._id
        }
      }
    }

    // Si existe un query de búsqueda
    if (query.searchTipo && query.searchTipo !== '') {
      if (query.searchTipo === 'nombres') {
        const searchValueParts = (query.searchValue as string).split(',')
        queryGobernadores = {
          ...queryGobernadores,
          nombres: {
            $regex: `.*${searchValueParts[0].trim().split(/\s/).join('.*')}.*`,
            $options: 'i'
          },
          apellidos: {
            $regex: `.*${searchValueParts[1].trim().split(/\s/).join('.*')}.*`,
            $options: 'i'
          }
        }
      }
    } else {
      // Si existe un query de organización politica
      if (query.organizacion && query.organizacion !== 'todos') {
        queryGobernadores = {
          ...queryGobernadores,
          organizacion: query.organizacion
        }
      }
    }

    // Intentamos obtener el total de registros de los gobernadores
    const totalRegistros: number = await Gobernador.find(queryGobernadores).count()

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

    // Intentamos realizar la búsqueda de todos los gobernadores paginados
    const list: Array<IGobernador> = await Gobernador.find(queryGobernadores, exclude_campos)
      .sort({ nombres: 'asc', apellidos: 'asc' })
      .populate('departamento', exclude_campos)
      .populate('organizacion', exclude_campos)
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de gobernadores
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
    console.log('Organizaciones Políticas', 'Obteniendo la lista de gobernadores', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los gobernadores'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de un gobernadore de una organización política //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id del gobernadore
  const { id } = params

  try {
    // Intentamos realizar la búsqueda por id
    const gobernador: IGobernador | null = await Gobernador.findById(id, exclude_campos)
      .populate('departamento', exclude_campos)
      .populate('organizacion', exclude_campos)

    // Retornamos los datos del gobernador
    return res.json({
      status: true,
      gobernador
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Obteniendo datos del gobernador', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos del gobernador'
    })
  }
}

/*******************************************************************************************************/
// Crear un nuevo gobernador de un organización política //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, el cuerpo y los archivos de la petición
  const { headers, usuario, body, files } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Verificamos si ya existe un gobernador para la organización
    const gobernadorU = await Gobernador.findOne({
      organizacion: body.organizacion,
      departamento: body.departamento
    })
    // Si existe un gobernador
    if (gobernadorU) {
      return res.status(404).json({
        status: false,
        msg: `Ya existe un gobernador para este departamento y organización política`
      })
    }

    // Creamos el modelo de un nuevo gobernador
    const newGobernador: IGobernador = new Gobernador(body)

    // Path o ruta del archivo
    const path = join('organizaciones-politicas', 'gobernadores')
    const pathUrl = 'organizaciones-politicas/gobernadores'
    const pathDefault = `${getPathUpload()}/${pathUrl}/no-foto.png`

    // Si existe un archivo de imagen obtenemos la url pública
    if (files && Object.keys(files).length > 0 && files.file) {
      newGobernador.foto = getUrlFile(<UploadedFile>files.file, pathUrl, newGobernador._id)
    } else {
      newGobernador.foto = pathDefault
    }

    // Intentamos guardar el nuevo gobernador
    const gobernadorOut: IGobernador = await newGobernador.save()

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
      descripcion: 'Crear nuevo gobernador de una organización política',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(gobernadorOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un archivo de imagen se crea la ruta y se almacena
    if (files && Object.keys(files).length > 0 && files.file) {
      await storeFile(<UploadedFile>files.file, path, newGobernador._id)
    }

    // Obtenemos el gobernador creado
    const gobernadorResp: IGobernador | null = await Gobernador.findById(
      gobernadorOut._id,
      exclude_campos
    )

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => gobernador creado en el módulo organizaciones políticas
      globalThis.socketIO.to('intranet').emit('organizaciones-politicas-gobernador-creado')
    }

    // Retornamos el gobernador creado
    return res.json({
      status: true,
      msg: 'Se creó el gobernador correctamente',
      gobernador: gobernadorResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Crear nuevo gobernador', error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo crear el gobernador'
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
// Actualizar los datos de un gobernador de una organización política //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros, query, el cuerpo y los archivos de la petición
  const { headers, usuario, params, query, body, files } = req
  // Obtenemos el Id del gobernador
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener el gobernador antes que se actualice
    const gobernadorIn: IGobernador | null = await Gobernador.findById(id)

    if (gobernadorIn && `${body.organizacion}` !== `${gobernadorIn?.organizacion}`) {
      // Verificamos si ya existe un gobernador para la organización
      const gobernadorU = await Gobernador.findOne({
        organizacion: body.organizacion,
        departamento: body.departamento
      })
      // Si existe un gobernador
      if (gobernadorU) {
        return res.status(404).json({
          status: false,
          msg: `Ya existe un gobernador para este departamento y organización política`
        })
      }
    }

    // Path o ruta del archivo
    const path = join('organizaciones-politicas', 'gobernadores')
    const pathUrl = 'organizaciones-politicas/gobernadores'
    const pathDefault = `${getPathUpload()}/${pathUrl}/no-foto.png`

    // Si existe un archivo de imagen obtenemos la url pública
    if (files && Object.keys(files).length > 0 && files.file) {
      body.foto = getUrlFile(<UploadedFile>files.file, pathUrl, id)
    } else {
      // Si el gobernador tiene una foto
      if (gobernadorIn?.foto) {
        // Si se removió la foto
        if (query.fileState === 'removed') {
          body.foto = pathDefault
        }
        // Caso contrario usamos la foto actual
        else {
          body.foto = gobernadorIn.foto
        }
      }
      // Si no hay foto limpiamos la actual
      else {
        body.foto = pathDefault
      }
    }

    // Intentamos realizar la búsqueda por id y actualizamos
    const gobernadorOut = await Gobernador.findByIdAndUpdate(
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
      descripcion: 'Actualizar un gobernador de una organización política',
      evento: eventsLogs.update,
      data_in: JSON.stringify(gobernadorIn, null, 2),
      data_out: JSON.stringify(gobernadorOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un archivo de imagen se crea la ruta y se almacena
    if (files && Object.keys(files).length > 0 && files.file) {
      await storeFile(<UploadedFile>files.file, path, id)
    }

    // Obtenemos el gobernador actualizado
    const gobernadorResp: IGobernador | null = await Gobernador.findById(id, exclude_campos)

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => gobernador actualizado en el módulo organizaciones políticas
      globalThis.socketIO.to('intranet').emit('organizaciones-politicas-gobernador-actualizado')
    }

    // Retornamos el gobernador actualizado
    return res.json({
      status: true,
      msg: 'Se actualizó el gobernador correctamente',
      gobernador: gobernadorResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Actualizando gobernador', id, error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo actualizar los datos del gobernador'
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
// Eliminar un gobernador de una organización política //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los parámetros de la petición
  const { headers, usuario, params } = req
  // Obtenemos el Id del gobernador
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos el gobernador antes que se elimine
    const gobernadorResp: IGobernador | null = await Gobernador.findById(id, exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const gobernadorIn: IGobernador | null = await Gobernador.findByIdAndRemove(id)

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
      descripcion: 'Remover un gobernador de una organización política',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(gobernadorIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Path o ruta del archivo
    const path = join('organizaciones-politicas', 'gobernadores')
    const pathUrl = 'organizaciones-politicas/gobernadores'
    const pathDefault = `${getPathUpload()}/${pathUrl}/no-foto.png`

    // Si existe una foto
    if (gobernadorIn && gobernadorIn.foto && gobernadorIn.foto !== pathDefault) {
      removeFile(gobernadorIn.foto, path)
    }

    // Si existe un servidor socketIO
    if (globalThis.socketIO) {
      // Emitimos el evento => gobernador eliminado en el módulo organizaciones políticas
      globalThis.socketIO.to('intranet').emit('organizaciones-politicas-gobernador-eliminado')
    }

    // Retornamos el gobernador eliminado
    return res.json({
      status: true,
      msg: 'Se eliminó el gobernador correctamente',
      gobernador: gobernadorResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Eliminando gobernador', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar el gobernador'
    })
  }
}
