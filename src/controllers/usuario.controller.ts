/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { Error } from 'mongoose'
import { UploadedFile } from 'express-fileupload'
import Usuario, { IUsuario } from '../models/usuario'
import Rol, { IRol } from '../models/admin/rol'
import encrypt from '../helpers/encrypt'
import { getUrlFile, storeFile, removeFile } from '../helpers/upload'
import { saveLog } from './admin/log.controller'
import _ from 'lodash'
import { parseNewDate24H_ } from '../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../helpers/pagination'
import { eventsLogs } from '../models/admin/log'

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo: string = 'usuarios'
const nombre_submodulo: string = ''
const nombre_controlador: string = 'usuario.controller'
const exclude_campos = '-password -createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todos los usuarios //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para el usuario
    let queryUsuario = {}

    // Si es un superusuario
    if (usuario.rol.super) {
      // Filtramos por el query de departamento
      if (query.departamento && query.departamento !== 'todos') {
        queryUsuario = { ...queryUsuario, departamento: query.departamento }
      }
      // Filtramos por el query de rol
      if (query.rol && query.rol !== 'todos') {
        queryUsuario = { ...queryUsuario, rol: query.rol }
      }
    } else {
      // Filtramos por los que no son superusuarios
      queryUsuario = {
        ...queryUsuario,
        super: usuario.rol.super,
        departamento: usuario.departamento?._id
      }
      // Filtramos por el departamento al que pertenece el usuario
      if (query.rol && query.rol !== 'todos') {
        queryUsuario = { ...queryUsuario, rol: query.rol }
      }
    }

    // Intentamos obtener el total de registros de usuarios
    const totalRegistros: number = await Usuario.find(queryUsuario).count()

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

    // Intentamos realizar la búsqueda de todos los usuarios paginados
    const list: Array<IUsuario> = await Usuario.find(queryUsuario, exclude_campos)
      .sort({ nombres: 'asc', apellidos: 'asc' })
      .populate('rol', exclude_campos)
      .populate('departamento', exclude_campos)
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de usuarios
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
    console.log('Usuarios', 'Obteniendo la lista de usuarios', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los usuarios'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de un usuario //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id del usuario
  const { id } = params
  try {
    // Intentamos realizar la búsqueda por id
    const usuario: IUsuario | null = await Usuario.findById(id, exclude_campos)
      .populate('rol', exclude_campos)
      .populate('departamento', exclude_campos)

    // Retornamos los datos del usuario encontrado
    return res.json({
      status: true,
      usuario
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Usuarios', 'Obteniendo datos de usuario', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos del usuario'
    })
  }
}

/*******************************************************************************************************/
// Crear un nuevo usuario //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, el cuerpo y los archivos de la petición
  const { headers, usuario, body, files } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Analizamos el rol ingresado
    const rol: IRol | null = await Rol.findById(body.rol)
    // Si existe un rol
    if (rol) {
      // Si el rol ingresado es de super usuario
      if (rol.super) {
        // Eliminamos el departamento
        delete body.departamento
        // Si es un super usuario
        if (usuario.rol.super) {
          body.super = true
        } else {
          // Retornamos
          return res.status(401).json({
            status: false,
            msg: 'Solo los super usuarios pueden crear otros super usuarios'
          })
        }
      }
      // En caso no sea un rol de super usuario
      else {
        body.super = false
        // Si el rol es de personero
        if (rol.codigo === 2) {
          body.anho = usuario.anho
        }
      }

      // Encriptamos la contraseña antes de guardarla
      const pwdEncrypted: string | null = await encrypt(body.password)
      // Insertamos la contraseña encriptada
      body.password = pwdEncrypted

      // Creamos el modelo de un nuevo usuario
      const newUsuario: IUsuario = new Usuario(body)

      // Path o ruta del archivo
      let path: string = 'usuarios'

      // Si existe un archivo de imagen obtenemos la url pública
      if (files && Object.keys(files).length > 0 && files.file) {
        newUsuario.img = getUrlFile(<UploadedFile>files.file, 'usuarios', newUsuario._id)
      }

      // Intentamos guardar el nuevo usuario
      const usuarioOut: IUsuario = await newUsuario.save()

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
        descripcion: 'Crear nuevo usuario',
        evento: eventsLogs.create,
        data_in: '',
        data_out: JSON.stringify(usuarioOut, null, 2),
        procesamiento: 'unico',
        registros: 1,
        id_grupo: `${usuario._id}@${parseNewDate24H_()}`
      })

      // Si existe un archivo de imagen se crea la ruta y se almacena
      if (files && Object.keys(files).length > 0 && files.file) {
        await storeFile(<UploadedFile>files.file, path, newUsuario._id)
      }

      // Obtenemos el usuario creado
      const usuarioResp: IUsuario | null = await Usuario.findById(usuarioOut._id, exclude_campos)
        .populate('rol', exclude_campos)
        .populate('departamento', exclude_campos)

      // Si existe un socket
      if (globalThis.socketIO) {
        // Emitimos el evento => usuario creado en el módulo usuarios, a todos los usuarios conectados //
        globalThis.socketIO.broadcast.emit('usuario-creado')
      }

      // Retornamos el usuario creado
      return res.json({
        status: true,
        msg: 'Se creó el usuario correctamente',
        usuario: usuarioResp
      })
    } else {
      // Retornamos
      return res.status(404).json({
        status: false,
        msg: 'El rol ingresado no existe'
      })
    }
  } catch (error: Error | any) {
    // Mostramos el error en consola
    console.log('Usuarios', 'Crear nuevo usuario', error)

    // Inicializamos el mensaje de error
    let msg: string = 'No se pudo crear el usuario'
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
// Actualizar los datos de un usuario //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros, query, el cuerpo y los archivos de la petición
  const { headers, usuario, params, query, body, files } = req
  // Obtenemos el Id del usuario
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener el usuario antes que se actualice
    const usuarioIn: IUsuario | null = await Usuario.findById(id)

    // Analizamos el rol
    const rol: IRol | null = await Rol.findById(body.rol)

    // Si existe un rol y si es de un superusuario
    if (rol && rol.super) {
      // Eliminamos el departamento
      delete body.departamento
    }

    // Si la contraseña es nula
    if (!body.password || body.password === 'null') {
      // Usamos la contraseña actual
      body.password = usuarioIn ? usuarioIn.password : ''
    } else {
      // Usamos la nueva contraseña y la encriptamos
      const pwdEncrypted: string | null = await encrypt(body.password)
      body.password = pwdEncrypted
    }

    // Path o ruta del archivo
    let path: string = 'usuarios'

    // Declaramos el objeto de variables que no se guardaran o se removerán
    let bodyUnset = {}

    // Si existe un archivo de imagen obtenemos la url pública
    if (files?.file) {
      body.img = getUrlFile(<UploadedFile>files.file, 'usuarios', id)
    } else {
      // Si el usuario tiene una imagen
      if (usuarioIn?.img) {
        // Si el usuario removió la imagen
        if (query.fileState === 'removed') {
          bodyUnset = { img: 1 }
        }
        // Caso contrario usamos la imagen actual
        else {
          body.img = usuarioIn.img
        }
      }
      // Si no hay imagen limpiamos la actual
      else {
        bodyUnset = { img: 1 }
      }
    }

    // Intentamos realizar la búsqueda por id y actualizamos
    const usuarioOut = await Usuario.findByIdAndUpdate(
      id,
      { $set: body, $unset: bodyUnset },
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
      descripcion: 'Actualizar un usuario',
      evento: eventsLogs.update,
      data_in: JSON.stringify(usuarioIn, null, 2),
      data_out: JSON.stringify(usuarioOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un archivo de imagen se crea la ruta y se almacena
    if (files?.file) {
      await storeFile(<UploadedFile>files.file, path, id)
    }

    // Obtenemos el usuario actualizado
    const usuarioResp: IUsuario | null = await Usuario.findById(id, exclude_campos)
      .populate('rol', exclude_campos)
      .populate('departamento', exclude_campos)

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => usuario actualizado en el módulo usuarios, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('usuario-actualizado')
    }

    // Retornamos el usuario actualizado
    return res.json({
      status: true,
      msg: 'Se actualizó el usuario correctamente',
      usuario: usuarioResp
    })
  } catch (error: Error | any) {
    // Mostramos el error en consola
    console.log('Usuarios', 'Actualizando usuario', id, error)

    // Inicializamos el mensaje de error
    let msg: string = 'No se pudo actualizar los datos del usuario'
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
// Eliminar un usuario //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros y el query de la petición
  const { headers, usuario, params, query } = req
  // Obtenemos el Id del usuario
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos el usuario antes que se elimine
    const usuarioResp: IUsuario | null = await Usuario.findById(id, exclude_campos)
      .populate('rol', exclude_campos)
      .populate('departamento', exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const usuarioIn: IUsuario | null = await Usuario.findByIdAndRemove(id)

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
      descripcion: 'Remover un usuario',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(usuarioIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Path o ruta del archivo
    let path: string = 'usuarios'

    // Si existe la imagen del usuario
    if (usuarioIn?.img && usuarioIn?.img !== '') {
      removeFile(usuarioIn.img, path)
    }

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => usuario eliminado en el módulo usuarios, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('usuario-eliminado')
    }

    // Retornamos el usuario eliminado
    return res.json({
      status: true,
      msg: 'Se eliminó el usuario correctamente',
      usuario: usuarioResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Usuarios', 'Eliminando usuario', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar el usuario'
    })
  }
}
