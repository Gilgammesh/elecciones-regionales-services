/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { Error } from 'mongoose'
import { join } from 'path'
import { UploadedFile } from 'express-fileupload'
import Alcalde, { IAlcalde } from '../../models/organizacion_politica/alcalde'
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
const nombre_submodulo = 'alcalde'
const nombre_controlador = 'alcalde.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todos los alcaldes de una organización política //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para los alcaldes
    let queryAlcaldees = {}

    // Si existe un query de organizacion politica
    if (query.organizacion) {
      queryAlcaldees = {
        ...queryAlcaldees,
        organizacion: query.organizacion
      }
    }

    // Filtramos por el query de departamento
    if (query.departamento && query.departamento !== 'todos') {
      if (usuario.rol.super) {
        queryAlcaldees = {
          ...queryAlcaldees,
          departamento: query.departamento,
          tipo: 'provincial'
        }
      } else {
        queryAlcaldees = {
          ...queryAlcaldees,
          departamento: usuario.departamento?._id,
          tipo: 'provincial'
        }
      }
    }

    // Filtramos por el query de provincia
    if (query.provincia && query.provincia !== 'todos') {
      queryAlcaldees = {
        ...queryAlcaldees,
        provincia: query.provincia,
        $or: [{ tipo: 'provincial' }, { tipo: 'distrital' }]
      }
    }

    // Filtramos por el query de distrito
    if (query.distrito && query.distrito !== 'todos') {
      queryAlcaldees = {
        ...queryAlcaldees,
        distrito: query.distrito,
        tipo: 'distrital'
      }
    }

    // Intentamos obtener el total de registros de los alcaldes
    const totalRegistros: number = await Alcalde.find(queryAlcaldees).count()

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

    // Intentamos realizar la búsqueda de todos los alcaldes paginados
    const list: Array<IAlcalde> = await Alcalde.find(queryAlcaldees, exclude_campos)
      .sort({
        provincia: 'asc',
        tipo: 'desc',
        nombres: 'asc',
        apellidos: 'asc'
      })
      .populate('departamento', exclude_campos)
      .populate('provincia', exclude_campos)
      .populate('organizacion', exclude_campos)
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de alcaldes
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
    console.log('Organizaciones Políticas', 'Obteniendo la lista de alcaldes', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los alcaldes'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de un alcalde de una organización política //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id del alcalde
  const { id } = params

  try {
    // Intentamos realizar la búsqueda por id
    const alcalde: IAlcalde | null = await Alcalde.findById(id, exclude_campos)
      .populate('departamento', exclude_campos)
      .populate('provincia', exclude_campos)
      .populate('organizacion', exclude_campos)

    // Retornamos los datos del alcalde
    return res.json({
      status: true,
      alcalde
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Obteniendo datos del alcalde', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos del alcalde'
    })
  }
}

/*******************************************************************************************************/
// Crear un nuevo alcalde de un organización política //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, el cuerpo y los archivos de la petición
  const { headers, usuario, body, files } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Verificamos si ya existe el alcalde
    const alcaldeU = await Alcalde.findOne({
      dni: body.dni,
      organizacion: body.organizacion
    })
    // Si existe un alcalde
    if (alcaldeU) {
      return res.status(404).json({
        status: false,
        msg: `Ya existe el alcalde para esta organización política`
      })
    }

    // Creamos el modelo de un nuevo alcalde
    const newAlcalde: IAlcalde = new Alcalde(body)

    // Path o ruta del archivo
    const path = join('organizaciones-politicas', 'alcaldes')
    const pathUrl = 'organizaciones-politicas/alcaldes'
    const pathDefault = `${getPathUpload()}/${pathUrl}/no-foto.png`

    // Si existe un archivo de imagen obtenemos la url pública
    if (files && Object.keys(files).length > 0 && files.file) {
      newAlcalde.foto = getUrlFile(<UploadedFile>files.file, pathUrl, newAlcalde._id)
    } else {
      newAlcalde.foto = pathDefault
    }

    // Intentamos guardar el nuevo alcalde
    const alcaldeOut: IAlcalde = await newAlcalde.save()

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
      descripcion: 'Crear nuevo alcalde de una organización política',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(alcaldeOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un archivo de imagen se crea la ruta y se almacena
    if (files && Object.keys(files).length > 0 && files.file) {
      await storeFile(<UploadedFile>files.file, path, newAlcalde._id)
    }

    // Obtenemos el alcalde creado
    const alcaldeResp: IAlcalde | null = await Alcalde.findById(alcaldeOut._id, exclude_campos)

    // Retornamos el alcalde creado
    return res.json({
      status: true,
      msg: 'Se creó el alcalde correctamente',
      alcalde: alcaldeResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Crear nuevo alcalde', error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo crear el alcalde'
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
// Actualizar los datos de un alcalde de una organización política //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros, query, el cuerpo y los archivos de la petición
  const { headers, usuario, params, body, files } = req
  // Obtenemos el Id del alcalde
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener el alcalde antes que se actualice
    const alcaldeIn: IAlcalde | null = await Alcalde.findById(id)

    // Path o ruta del archivo
    const path = join('organizaciones-politicas', 'alcaldes')
    const pathUrl = 'organizaciones-politicas/alcaldes'
    const pathDefault = `${getPathUpload()}/${pathUrl}/no-foto.png`

    // Si existe un archivo de imagen obtenemos la url pública
    if (files && Object.keys(files).length > 0 && files.file) {
      body.foto = getUrlFile(<UploadedFile>files.file, pathUrl, id)
    } else {
      body.foto = pathDefault
    }

    // Intentamos realizar la búsqueda por id y actualizamos
    const alcaldeOut = await Alcalde.findByIdAndUpdate(
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
      descripcion: 'Actualizar un alcalde de una organización política',
      evento: eventsLogs.update,
      data_in: JSON.stringify(alcaldeIn, null, 2),
      data_out: JSON.stringify(alcaldeOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un archivo de imagen se crea la ruta y se almacena
    if (files && Object.keys(files).length > 0 && files.file) {
      await storeFile(<UploadedFile>files.file, path, id)
    }

    // Obtenemos el alcalde actualizado
    const alcaldeResp: IAlcalde | null = await Alcalde.findById(id, exclude_campos)

    // Retornamos el alcalde actualizado
    return res.json({
      status: true,
      msg: 'Se actualizó el alcalde correctamente',
      alcalde: alcaldeResp
    })
  } catch (error: unknown) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Actualizando alcalde', id, error)

    // Inicializamos el mensaje de error
    let msg = 'No se pudo actualizar los datos del alcalde'
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
// Eliminar un alcalde de una organización política //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los parámetros de la petición
  const { headers, usuario, params } = req
  // Obtenemos el Id del alcalde
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos el alcalde antes que se elimine
    const alcaldeResp: IAlcalde | null = await Alcalde.findById(id, exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const alcaldeIn: IAlcalde | null = await Alcalde.findByIdAndRemove(id)

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
      descripcion: 'Remover un alcalde de una organización política',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(alcaldeIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Path o ruta del archivo
    const path = join('organizaciones-politicas', 'alcaldes')
    const pathUrl = 'organizaciones-politicas/alcaldes'
    const pathDefault = `${getPathUpload()}/${pathUrl}/no-foto.png`

    // Si existe una foto
    if (alcaldeIn && alcaldeIn.foto && alcaldeIn.foto !== pathDefault) {
      removeFile(alcaldeIn.foto, path)
    }

    // Retornamos el alcalde eliminado
    return res.json({
      status: true,
      msg: 'Se eliminó el alcalde correctamente',
      alcalde: alcaldeResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Organizaciones Políticas', 'Eliminando alcalde', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar el alcalde'
    })
  }
}
