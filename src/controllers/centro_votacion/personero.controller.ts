/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { join } from 'path'
import { Error } from 'mongoose'
import { UploadedFile } from 'express-fileupload'
import Personero, { IPersonero } from '../../models/centro_votacion/personero'
import Mesa from '../../models/centro_votacion/mesa'
import xlsxFile from 'read-excel-file/node'
import { Row } from 'read-excel-file/types'
import _ from 'lodash'
import encrypt from '../../helpers/encrypt'
import { storeFile } from '../../helpers/upload'
import { parseNewDate24H_ } from '../../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../../helpers/pagination'
import { saveLog } from '../admin/log.controller'
import { eventsLogs } from '../../models/admin/log'

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo: string = 'centros-votacion'
const nombre_submodulo: string = 'personeros'
const nombre_controlador: string = 'personero.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todos los personeros //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para el personero
    let queryPersoneros = {}

    // Añadimos el año
    queryPersoneros = { ...queryPersoneros, anho: usuario.anho }
    // Si es un superusuario
    if (usuario.rol.super) {
      // Filtramos por el query de departamento
      if (query.departamento && query.departamento !== 'todos') {
        queryPersoneros = {
          ...queryPersoneros,
          departamento: query.departamento
        }
      }
    } else {
      // Filtramos por el departamento del usuario
      queryPersoneros = {
        ...queryPersoneros,
        departamento: usuario.departamento?._id
      }
    }
    // Si existe un query de búsqueda
    if (query.searchTipo && query.searchTipo !== '') {
      if (query.searchTipo === 'nombres') {
        const searchValueParts = (query.searchValue as string).split(',')
        queryPersoneros = {
          ...queryPersoneros,
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
      if (query.searchTipo === 'dni') {
        queryPersoneros = {
          ...queryPersoneros,
          dni: {
            $regex: `.*${query.searchValue as string}.*`,
            $options: 'i'
          }
        }
      }
      if (query.searchTipo === 'celular') {
        queryPersoneros = {
          ...queryPersoneros,
          celular: {
            $regex: `.*${query.searchValue as string}.*`,
            $options: 'i'
          }
        }
      }
    } else {
      if (query.estado && query.estado !== 'todos') {
        // Filtramos por el query de estado de personero
        queryPersoneros = {
          ...queryPersoneros,
          estado: query.estado
        }
      }
      // Filtramos por el query de tipo de personero
      if (query.tipo && query.tipo !== 'todos') {
        queryPersoneros = {
          ...queryPersoneros,
          tipo: query.tipo
        }
      }
    }

    // Intentamos obtener el total de registros de personeros
    const totalRegistros: number = await Personero.find(queryPersoneros).count()

    // Obtenemos el número de registros por página y hacemos las validaciones
    const validatePageSize: any = await getPageSize(
      pagination.pageSize,
      query.pageSize
    )
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
    const validatePage: any = await getPage(
      pagination.page,
      query.page,
      totalPaginas
    )
    if (!validatePage.status) {
      return res.status(404).json({
        status: validatePage.status,
        msg: validatePage.msg
      })
    }
    const page = validatePage.page

    // Intentamos realizar la búsqueda de todos los personeros paginados
    const list: Array<IPersonero> = await Personero.find(
      queryPersoneros,
      exclude_campos
    )
      .sort({ nombres: 'asc', apellidos: 'asc' })
      .populate('departamento', exclude_campos)
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de personeros
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
      'Centros de Votación',
      'Obteniendo la lista de personeros',
      error
    )
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los personeros'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de un personero //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id del personero
  const { id } = params
  try {
    // Intentamos realizar la búsqueda por id
    const personero: IPersonero | null = await Personero.findById(
      id,
      exclude_campos
    ).populate('departamento', exclude_campos)

    // Retornamos los datos del personero encontrado
    return res.json({
      status: true,
      personero
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log(
      'Centros de Votación',
      'Obteniendo datos de personero',
      id,
      error
    )
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos del personero'
    })
  }
}

/*******************************************************************************************************/
// Crear un nuevo personero //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y el cuerpo de la petición
  const { headers, usuario, body } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Verificamos si ya existe el personero
    const personeroU = await Personero.findOne({
      dni: body.dni,
      anho: usuario.anho
    })
    //
    if (personeroU) {
      return res.status(404).json({
        status: false,
        msg: `Ya existe un personero con este DNI para estas elecciones ${usuario.anho}`
      })
    }

    // Establecemos el año
    body.anho = usuario.anho

    // Establecemos la contraseña personalizada
    const initNom = (body.nombres as string).slice(0, 1).toUpperCase()
    const initApe = (body.apellidos as string).slice(0, 1).toUpperCase()
    const password = `${body.dni}${initNom}${initApe}`

    // Encriptamos la contraseña antes de guardarla
    const pwdEncrypted: string | null = await encrypt(password)
    // Establecemos la contraseña encriptada
    body.password = pwdEncrypted

    // Creamos el modelo de un nuevo personero
    const newPersonero: IPersonero = new Personero(body)

    // Intentamos guardar el nuevo personero
    const personeroOut: IPersonero = await newPersonero.save()

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
      descripcion: 'Crear nuevo personero',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(personeroOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos el personero creado
    const personeroResp: IPersonero | null = await Personero.findById(
      personeroOut._id,
      exclude_campos
    ).populate('departamento', exclude_campos)

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => personero creado en el módulo centros de votación, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('centros-votacion-personero-creado')
    }

    // Retornamos el personero creado
    return res.json({
      status: true,
      msg: 'Se creó el personero correctamente',
      personero: personeroResp
    })
  } catch (error: Error | any) {
    // Mostramos el error en consola
    console.log('Centros de Votación', 'Crear nuevo personero', error)

    // Inicializamos el mensaje de error
    let msg: string = 'No se pudo crear el personero'
    // Si existe un error con validación de campo único
    if (error?.errors) {
      // Obtenemos el array de errores
      const array: string[] = Object.keys(error.errors)
      // Construimos el mensaje de error de acuerdo al campo
      msg = `${error.errors[array[0]].path}: ${
        error.errors[array[0]].properties.message
      }`
    }

    // Retornamos
    return res.status(404).json({
      status: false,
      msg
    })
  }
}

/*******************************************************************************************************/
// Actualizar los datos de un personero //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros, query, el cuerpo y los archivos de la petición
  const { headers, usuario, params, body } = req
  // Obtenemos el Id del personero
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener el personero antes que se actualice
    const personeroIn: IPersonero | null = await Personero.findById(id)

    if (personeroIn && personeroIn.dni !== body.dni) {
      // Verificamos si ya existe el personero
      const personeroU = await Personero.findOne({
        dni: body.dni,
        anho: usuario.anho
      })
      //
      if (personeroU) {
        return res.status(404).json({
          status: false,
          msg: `Ya existe un personero con este DNI para estas elecciones ${usuario.anho}`
        })
      }
    }

    // Si la contraseña es nula
    if (!body.password || body.password === 'null') {
      // Usamos la contraseña actual
      body.password = personeroIn ? personeroIn.password : ''
    } else {
      // Usamos la nueva contraseña y la encriptamos
      const pwdEncrypted: string | null = await encrypt(body.password)
      body.password = pwdEncrypted
    }

    // Intentamos realizar la búsqueda por id y actualizamos
    const personeroOut = await Personero.findByIdAndUpdate(
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
      descripcion: 'Actualizar un personero',
      evento: eventsLogs.update,
      data_in: JSON.stringify(personeroIn, null, 2),
      data_out: JSON.stringify(personeroOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos el personero actualizado
    const personeroResp: IPersonero | null = await Personero.findById(
      id,
      exclude_campos
    ).populate('departamento', exclude_campos)

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => personero actualizado en el módulo centros de votación, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit(
        'centros-votacion-personero-actualizado'
      )
    }

    // Retornamos el personero actualizado
    return res.json({
      status: true,
      msg: 'Se actualizó el personero correctamente',
      personero: personeroResp
    })
  } catch (error: Error | any) {
    // Mostramos el error en consola
    console.log('Centros de Votación', 'Actualizando personero', id, error)

    // Inicializamos el mensaje de error
    let msg: string = 'No se pudo actualizar los datos del personero'
    // Si existe un error con validación de campo único
    if (error?.errors) {
      // Obtenemos el array de errores
      const array: string[] = Object.keys(error.errors)
      // Construimos el mensaje de error de acuerdo al campo
      msg = `${error.errors[array[0]].path}: ${
        error.errors[array[0]].properties.message
      }`
    }

    // Retornamos
    return res.status(404).json({
      status: false,
      msg
    })
  }
}

/*******************************************************************************************************/
// Eliminar un personero //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros y el query de la petición
  const { headers, usuario, params, query } = req
  // Obtenemos el Id del personero
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos el personero antes que se elimine
    const personeroResp: IPersonero | null = await Personero.findById(
      id,
      exclude_campos
    ).populate('departamento', exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const personeroIn: IPersonero | null = await Personero.findByIdAndRemove(id)
    // Removemos el personero de la mesa, local, provincia o distrito
    await Mesa.updateMany(
      { personero_mesa: id },
      { $unset: { personero_mesa: 1 } }
    )
    await Mesa.updateMany(
      { personero_local: id },
      { $unset: { personero_local: 1 } }
    )
    await Mesa.updateMany(
      { personero_distrito: id },
      { $unset: { personero_distrito: 1 } }
    )
    await Mesa.updateMany(
      { personero_provincia: id },
      { $unset: { personero_provincia: 1 } }
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
      funcion: 'remove',
      descripcion: 'Remover un personero',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(personeroIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => personero eliminado en el módulo centros de votación, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('centros-votacion-personero-eliminado')
    }

    // Retornamos el personero eliminado
    return res.json({
      status: true,
      msg: 'Se eliminó el personero correctamente',
      personero: personeroResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Centros de Votación', 'Eliminando personero', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar el personero'
    })
  }
}

/*******************************************************************************************************/
// Interface mensajes de errores //
/*******************************************************************************************************/
interface IMsgError {
  index: number
  msg: string
}

/*******************************************************************************************************/
// Procesar archivo excel de personeros //
/*******************************************************************************************************/
export const importExcel: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, el query y los archivos de la petición
  const { headers, usuario, query, files } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  // Si existe un archivo de excel se crea la ruta y se almacena
  if (files && Object.keys(files).length > 0 && files.file) {
    try {
      // Guardamos el archivo localmente para recorrerlo y obtenemos la ruta
      const pathFile: string = await storeFile(
        <UploadedFile>files.file,
        join('centros-votacion', 'personeros'),
        'temp'
      )

      let dptoId: string
      if (usuario.rol.super) {
        dptoId = query.departamento as string
      } else {
        dptoId = usuario.departamento?._id as string
      }

      // Obtenemos las filas de la plantilla de excel
      const rows: Row[] = await xlsxFile(pathFile, { sheet: 1 })

      // Inicializamos el array de mensajes de error
      let msgError: IMsgError[] = []

      // Establecemos la fila de inicio
      const rowStart: number = 1

      // Establecemos el id de grupo de log
      let id_grupo: string = `${usuario._id}@${parseNewDate24H_()}`

      // Recorremos las filas para ver si hay errores
      const promises1 = rows.map(async (row, index) => {
        // Si el index es mayor o igual al fila de inicio
        if (index >= rowStart) {
          const msg = await validateFields(row, index, usuario.anho)
          // Si no pasó las validaciones
          if (msg !== 'ok') {
            // Guardamos el mensaje de error en el array de mensajes
            msgError.push({ index, msg })
          }
        }
        return null
      })
      await Promise.all(promises1)

      // Si hubo errores retornamos el detalle de los mensajes de error
      if (msgError.length > 0) {
        return res.json({
          status: true,
          errores: _.orderBy(msgError, ['index'], ['asc'])
        })
      } else {
        // Si no hubo errores, recorremos las filas y guardamos
        const promises2 = rows.map(async (row, index) => {
          // Si el el index es mayor o igual al fila de inicio
          if (index >= rowStart) {
            // Encriptamos la contraseña personalizada, antes de guardarla
            const iniNo = `${row[0]}`.trim().slice(0, 1).toLocaleUpperCase()
            const iniAp = `${row[1]}`.trim().slice(0, 1).toLocaleUpperCase()
            const pwdEncrypted: string | null = await encrypt(
              `${row[2]}${iniNo}${iniAp}`
            )

            // Creamos el modelo de un nuevo personero
            const newPersonero: IPersonero = new Personero({
              nombres: `${row[0]}`.trim(),
              apellidos: `${row[1]}`.trim(),
              dni: `${row[2]}`,
              celular: `${row[3]}`,
              password: pwdEncrypted,
              departamento: dptoId,
              anho: usuario.anho
            })

            // Intentamos guardar el nuevo personero
            const personeroOut: IPersonero = await newPersonero.save()

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
              descripcion: 'Crear nuevo personero por excel importado',
              evento: eventsLogs.create,
              data_in: '',
              data_out: JSON.stringify(personeroOut, null, 2),
              procesamiento: 'masivo',
              registros: 1,
              id_grupo
            })
          }
          return null
        })
        await Promise.all(promises2)

        // Si existe un socket
        if (globalThis.socketIO) {
          // Emitimos el evento => personeros importados en el módulo centro de votación, a todos los usuarios conectados //
          globalThis.socketIO.broadcast.emit(
            'centros-votacion-personeros-importados'
          )
        }

        // Retornamos el detalle de los mensajes de error si existen
        return res.json({
          status: true
        })
      }
    } catch (error) {
      // Mostramos el error en consola
      console.log(
        'Centros de Votación',
        'Importando Excel de Personeros',
        error
      )
      // Retornamos
      return res.status(404).json({
        status: false,
        msg: 'No se pudo subir el archivo excel de personeros'
      })
    }
  }
}

/*******************************************************************************************************/
// Función para validar los campos del excel de personeros //
/*******************************************************************************************************/
const validateFields = async (
  row: Row,
  index: number,
  anho: number | undefined
) => {
  // Validamos que nombres no esté vacio
  if (`${row[0]}` === '' || row[0] === null) {
    return `Fila ${index}: El campo nombres no puede estar vacio`
  }
  // Validamos que apellidos no esté vacio
  if (`${row[1]}` === '' || row[1] === null) {
    return `Fila ${index}: El campo apellidos no puede estar vacio`
  }
  // Validamos que DNI no esté vacio
  if (`${row[2]}` === '' || row[2] === null) {
    return `Fila ${index}: El campo DNI no puede estar vacio`
  }
  // Validamos que celular no esté vacio
  if (`${row[3]}` === '' || row[3] === null) {
    return `Fila ${index}: El campo celular no puede estar vacio`
  }
  // Validamos que el DNI tenga 8 dígitos
  if (`${row[2]}`.length !== 8) {
    return `Fila ${index}: El campo DNI debe tener 8 dígitos`
  }
  // Validamos que el Celular tenga 9 dígitos
  if (`${row[3]}`.length !== 9) {
    return `Fila ${index}: El campo Celular debe tener 9 dígitos`
  }
  // Si existe un personero con el DNI y el año
  const personeroU = await Personero.findOne({
    dni: `${row[2]}`,
    anho
  })
  if (personeroU) {
    return `Fila ${index}: El número de DNI ${row[2]}, ya se encuentra registrado para estas elecciones ${anho}`
  }
  // Si pasó todas las validaciones
  return 'ok'
}
