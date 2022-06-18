/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { join } from 'path'
import { Error } from 'mongoose'
import { UploadedFile } from 'express-fileupload'
import xlsxFile from 'read-excel-file/node'
import { Row } from 'read-excel-file/types'
import Personero, { IPersonero } from '../../models/centro_votacion/personero'
import Mesa, { IMesa } from '../../models/centro_votacion/mesa'
import Departamento, { IDepartamento } from '../../models/ubigeo/departamento'
import Provincia, { IProvincia } from '../../models/ubigeo/provincia'
import Distrito, { IDistrito } from '../../models/ubigeo/distrito'
import _ from 'lodash'
import { storeFile } from '../../helpers/upload'
import { saveLog } from '../admin/log.controller'
import { parseNewDate24H_ } from '../../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../../helpers/pagination'
import { eventsLogs } from '../../models/admin/log'

/*******************************************************************************************************/
// Tipos del Componente //
/*******************************************************************************************************/
const TiposPersonero = {
  MESA: 'mesa',
  LOCAL: 'local'
}
const ActionsPersonero = {
  ADD: 'add',
  CHANGE: 'change',
  REMOVE: 'remove'
}

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo: string = 'centros-votacion'
const nombre_submodulo: string = 'mesas'
const nombre_controlador: string = 'mesa.controller'
const exclude_campos = '-createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todas las mesas de votación //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para las mesas de votación
    let queryMesas = {}

    // Añadimos el año
    queryMesas = { ...queryMesas, anho: usuario.anho }
    // Obtenemos el código del departamente según el caso
    let codDpto: string = usuario.rol.super
      ? (query.departamento as string)
      : (usuario.departamento?.codigo as string)
    // Filtramos por el query de departamento
    if (query.departamento && query.departamento !== 'todos') {
      queryMesas = {
        ...queryMesas,
        ubigeo: { $regex: `^${codDpto}.*` }
      }
    }

    // Si existe un query de búsqueda
    if (query.searchTipo && query.searchTipo !== '') {
      if (query.searchTipo === 'mesa') {
        queryMesas = {
          ...queryMesas,
          mesa: {
            $regex: `.*${query.searchValue as string}.*`,
            $options: 'i'
          }
        }
      }
      if (query.searchTipo === 'local') {
        queryMesas = {
          ...queryMesas,
          local: {
            $regex: `.*${query.searchValue as string}.*`,
            $options: 'i'
          }
        }
      }
    } else {
      // Filtramos por el query de estado de personero
      if (query.assign && query.assign !== 'todos') {
        queryMesas = {
          ...queryMesas,
          $or: [
            { personero_mesa: { $exists: query.assign } },
            { personero_local: { $exists: query.assign } }
          ]
        }
      }
      // Filtramos por el query de provincia
      if (query.provincia && query.provincia !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: { $regex: `^${codDpto}${query.provincia}.*` }
        }
      }
      // Filtramos por el query de distrito
      if (query.distrito && query.distrito !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: { $regex: `^${codDpto}${query.provincia}${query.distrito}.*` }
        }
      }
    }

    // Intentamos obtener el total de registros de mesas de votación
    const totalRegistros: number = await Mesa.find(queryMesas).count()

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

    // Intentamos realizar la búsqueda de todos los centros de votación paginados
    const list: Array<IMesa> = await Mesa.find(queryMesas, exclude_campos)
      .sort({ ubigeo: 'asc', mesa: 'asc' })
      .populate('departamento', exclude_campos)
      .populate('provincia', exclude_campos)
      .populate('distrito', exclude_campos)
      .populate('personero_provincia', exclude_campos)
      .populate('personero_distrito', exclude_campos)
      .populate('personero_local', exclude_campos)
      .populate('personero_mesa', exclude_campos)
      .collation({ locale: 'es', numericOrdering: true })
      .skip((page - 1) * pageSize)
      .limit(pageSize)

    // Retornamos la lista de centros de votación
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
      'Obteniendo la lista de mesas de votación',
      error
    )
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener las mesas de votación'
    })
  }
}

/*******************************************************************************************************/
// Obtener datos de una mesa de votación //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
  // Leemos los parámetros de la petición
  const { params } = req
  // Obtenemos el Id de la mesa de votación
  const { id } = params

  try {
    // Intentamos realizar la búsqueda por id
    const mesa: IMesa | null = await Mesa.findById(id, exclude_campos)
      .populate('departamento', exclude_campos)
      .populate('provincia', exclude_campos)
      .populate('distrito', exclude_campos)
      .populate('personero_provincia', exclude_campos)
      .populate('personero_distrito', exclude_campos)
      .populate('personero_local', exclude_campos)
      .populate('personero_mesa', exclude_campos)

    // Retornamos los datos de la mesa de votación encontrada
    return res.json({
      status: true,
      mesa
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log(
      'Centros de Votación',
      'Obteniendo datos de mesa de votación',
      id,
      error
    )
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los datos de la mesa de votación'
    })
  }
}

/*******************************************************************************************************/
// Crear una nueva mesa de votación //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, el cuerpo y los archivos de la petición
  const { headers, usuario, body } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Verificamos si ya existe la mesa de votación
    const mesaU = await Mesa.findOne({
      mesa: body.mesa,
      anho: usuario.anho
    })
    //
    if (mesaU) {
      return res.status(404).json({
        status: false,
        msg: `Ya existe la mesa de votación para estas elecciones ${usuario.anho}`
      })
    }

    // Inicializamos el código de departamento
    let codDpto: string | undefined = ''
    // Si no es un superusuario
    if (usuario.rol.super) {
      codDpto = body.departamento
    } else {
      codDpto = usuario.departamento?.codigo
    }

    // Obtenemos los datos del departamento si existe
    const departamento: IDepartamento | null = await Departamento.findOne({
      codigo: codDpto
    })

    // Obtenemos los datos de la provincia si existe si existe
    const provincia: IProvincia | null = await Provincia.findOne({
      codigo: body.provincia,
      departamento: codDpto
    })

    // Obtenemos los datos del distrito si existe
    const distrito: IDistrito | null = await Distrito.findOne({
      codigo: body.distrito,
      provincia: body.provincia,
      departamento: codDpto
    })

    // Creamos el modelo de una nueva mesa de votacion
    const newMesa: IMesa = new Mesa({
      ubigeo: distrito?.ubigeo,
      departamento: departamento?._id,
      provincia: provincia?._id,
      distrito: distrito?._id,
      nombre: body.nombre,
      mesa: body.mesa,
      ...(body.votantes && {
        votantes: parseInt(body.votantes, 10)
      }),
      anho: usuario.anho
    })

    // Intentamos guardar la nueva mesa de votación
    const mesaOut: IMesa = await newMesa.save()

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
      descripcion: 'Crear nueva mesa de votación',
      evento: eventsLogs.create,
      data_in: '',
      data_out: JSON.stringify(mesaOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos la mesa de votación creada
    const mesaResp: IMesa | null = await Mesa.findById(
      mesaOut._id,
      exclude_campos
    )

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => mesa de votación creada en el módulo centros de votación, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('centros-votacion-mesa-creada')
    }

    // Retornamos la mesa de votación creada
    return res.json({
      status: true,
      msg: 'Se creó la mesa de votación correctamente',
      mesa: mesaResp
    })
  } catch (error: Error | any) {
    // Mostramos el error en consola
    console.log('Centros de Votación', 'Crear nueva mesa de votación', error)

    // Inicializamos el mensaje de error
    let msg: string = 'No se pudo crear la mesa de votación'
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
// Actualizar los datos de una mesa de votación //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros y el cuerpo de la petición
  const { headers, usuario, params, body } = req
  // Obtenemos el Id de la mesa de votación
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Intentamos obtener la mesa de votación antes que se actualice
    const mesaIn: IMesa | null = await Mesa.findById(id)

    // Intentamos realizar la búsqueda por id y actualizamos
    let mesaOut: IMesa | null = null
    // Si existe un tipo en el cuerpo (Asignar personero)
    if (body.tipoPers && body.tipoPers !== '') {
      if (body.tipoPers === TiposPersonero.MESA) {
        mesaOut = await Mesa.findByIdAndUpdate(
          id,
          body.actionPers === ActionsPersonero.REMOVE
            ? { $unset: { personero_mesa: 1 } }
            : { $set: { personero_mesa: body.personero } },
          {
            new: true,
            runValidators: true,
            context: 'query'
          }
        )
        if (body.actionPers === ActionsPersonero.CHANGE) {
          await Personero.findByIdAndUpdate(
            mesaIn?.personero_mesa,
            {
              $set: { asignado: false },
              $unset: { tipo: 1, asignadoA: 1 }
            },
            {
              new: true,
              runValidators: true,
              context: 'query'
            }
          )
        }
        await Personero.findByIdAndUpdate(
          body.personero,
          body.actionPers === ActionsPersonero.REMOVE
            ? {
                $set: { asignado: false },
                $unset: { tipo: 1, asignadoA: 1 }
              }
            : {
                $set: {
                  asignado: true,
                  tipo: TiposPersonero.MESA,
                  asignadoA: body.mesa.mesa
                }
              },
          {
            new: true,
            runValidators: true,
            context: 'query'
          }
        )
      }
      if (body.tipoPers === TiposPersonero.LOCAL) {
        await Mesa.updateMany(
          { local: body.mesa.local },
          body.actionPers === ActionsPersonero.REMOVE
            ? { $unset: { personero_local: 1 } }
            : { $set: { personero_local: body.personero } }
        )
        if (body.actionPers === ActionsPersonero.CHANGE) {
          await Personero.findByIdAndUpdate(
            mesaIn?.personero_local,
            {
              $set: { asignado: false },
              $unset: { tipo: 1, asignadoA: 1 }
            },
            {
              new: true,
              runValidators: true,
              context: 'query'
            }
          )
        }
        await Personero.findByIdAndUpdate(
          body.personero,
          body.actionPers === ActionsPersonero.REMOVE
            ? {
                $set: { asignado: false },
                $unset: { tipo: 1, asignadoA: 1 }
              }
            : {
                $set: {
                  asignado: true,
                  tipo: TiposPersonero.LOCAL,
                  asignadoA: body.mesa.local
                }
              },
          {
            new: true,
            runValidators: true,
            context: 'query'
          }
        )
      }
    } else {
      mesaOut = await Mesa.findByIdAndUpdate(
        id,
        { $set: body },
        {
          new: true,
          runValidators: true,
          context: 'query'
        }
      )
    }

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
      descripcion: 'Actualizar una mesa de votación',
      evento: eventsLogs.update,
      data_in: JSON.stringify(mesaIn, null, 2),
      data_out: JSON.stringify(mesaOut, null, 2),
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Obtenemos la mesa de votación actualizada
    const mesaResp: IMesa | null = await Mesa.findById(id, exclude_campos)

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => mesa de votación actualizada en el módulo centros de votación, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('centros-votacion-mesa-actualizada')
    }

    // Retornamos la mesa de votación actualizada
    return res.json({
      status: true,
      msg: 'Se actualizó la mesa de votación correctamente',
      mesa: mesaResp
    })
  } catch (error: Error | any) {
    // Mostramos el error en consola
    console.log(
      'Centros de Votación',
      'Actualizando mesa de votación',
      id,
      error
    )

    // Inicializamos el mensaje de error
    let msg: string = 'No se pudo actualizar los datos de la mesa de votación'
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
// Eliminar una mesa de votación //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario, los parámetros y el query de la petición
  const { headers, usuario, params, query } = req
  // Obtenemos el Id de la mesa de votación
  const { id } = params

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  try {
    // Obtenemos la mesa de votación antes que se elimine
    const mesaResp: IMesa | null = await Mesa.findById(id, exclude_campos)

    // Intentamos realizar la búsqueda por id y removemos
    const mesaIn: IMesa | null = await Mesa.findByIdAndRemove(id)

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
      descripcion: 'Remover una mesa de votación',
      evento: eventsLogs.remove,
      data_in: JSON.stringify(mesaIn, null, 2),
      data_out: '',
      procesamiento: 'unico',
      registros: 1,
      id_grupo: `${usuario._id}@${parseNewDate24H_()}`
    })

    // Si existe un socket
    if (globalThis.socketIO) {
      // Emitimos el evento => mesa de votación eliminada en el módulo centros de votación, a todos los usuarios conectados //
      globalThis.socketIO.broadcast.emit('centros-votacion-mesa-eliminada')
    }

    // Retornamos la mesa de votación eliminada
    return res.json({
      status: true,
      msg: 'Se eliminó la mesa de votación correctamente',
      mesa: mesaResp
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Centros de Votación', 'Eliminando mesa de votación', id, error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo eliminar la mesa de votación'
    })
  }
}

/*******************************************************************************************************/
// Obtener los personeros disponibles //
/*******************************************************************************************************/
export const getPersoneros: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { query } = req

  try {
    // Definimos el query de los personeros
    const queryPersoneros = {
      departamento: query.departamento,
      nombres: {
        $regex: `.*${(query.nombres as string).split(/\s/).join('.*')}.*`,
        $options: 'i'
      },
      apellidos: {
        $regex: `.*${(query.apellidos as string).split(/\s/).join('.*')}.*`,
        $options: 'i'
      },
      dni: {
        $regex: `.*${query.dni}.*`,
        $options: 'i'
      },
      asignado: false
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
      'Mesas',
      'Obteniendo la lista de personeros disponibles',
      error
    )
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los personeros disponibles'
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
// Procesar archivo excel de mesas de votación //
/*******************************************************************************************************/
export const importExcel: Handler = async (req, res) => {
  // Leemos las cabeceras, el usuario y los archivos de la petición
  const { headers, usuario, files } = req

  // Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
  const { source, origin, ip, device, browser } = headers

  // Si existe un archivo de excel se crea la ruta y se almacena
  if (files && Object.keys(files).length > 0 && files.file) {
    try {
      // Guardamos el archivo localmente para recorrerlo y obtenemos la ruta
      const pathFile: string = await storeFile(
        <UploadedFile>files.file,
        join('centros-votacion', 'mesas'),
        'temp'
      )

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
          const msg = await validateFields(
            row,
            index,
            usuario.departamento ? usuario.departamento?.codigo : '',
            usuario.rol.super,
            usuario.anho
          )
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
            // Obtenemos los datos del departamento si existe
            const departamento: IDepartamento | null =
              await Departamento.findOne({
                codigo: `${row[0]}`.substring(0, 2)
              })
            // Obtenemos los datos de la provincia si existe
            const provincia: IProvincia | null = await Provincia.findOne({
              codigo: `${row[0]}`.substring(2, 4),
              departamento: `${row[0]}`.substring(0, 2)
            })
            // Obtenemos los datos del distrito si existe
            const distrito: IDistrito | null = await Distrito.findOne({
              codigo: `${row[0]}`.substring(4, 6),
              provincia: `${row[0]}`.substring(2, 4),
              departamento: `${row[0]}`.substring(0, 2)
            })

            // Creamos el modelo de una nueva mesa de votación
            const newMesa: IMesa = new Mesa({
              mesa: `${row[5]}`,
              ...(row[6] && { votantes: parseInt(`${row[6]}`, 10) }),
              local: `${row[4]}`.trim(),
              departamento: departamento?._id,
              provincia: provincia?._id,
              distrito: distrito?._id,
              ubigeo: `${row[0]}`,
              anho: usuario.anho
            })

            // Intentamos guardar la nueva mesa de votación
            const mesaOut: IMesa = await newMesa.save()

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
              descripcion: 'Crear nueva mesa de votación por excel importado',
              evento: eventsLogs.create,
              data_in: '',
              data_out: JSON.stringify(mesaOut, null, 2),
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
          // Emitimos el evento => mesas de votación importados en el módulo centros de votación, a todos los usuarios conectados //
          globalThis.socketIO.broadcast.emit(
            'centros-votacion-mesas-importadas'
          )
        }

        // Retornamos el detalle de los mensajes de error si existen
        return res.json({
          status: true,
          errores: _.orderBy(msgError, ['index'], ['asc'])
        })
      }
    } catch (error) {
      // Mostramos el error en consola
      console.log(
        'Centros de Votación',
        'Importando Excel de Mesas de Votación',
        error
      )
      // Retornamos
      return res.status(404).json({
        status: false,
        msg: 'No se pudo subir el archivo excel de mesas de votación.'
      })
    }
  }
}

/*******************************************************************************************************/
// Función para validar los campos del excel de mesas de votación //
/*******************************************************************************************************/
const validateFields = async (
  row: Row,
  index: number,
  codigo: string,
  superUser: boolean,
  anho: number | undefined
) => {
  // Validamos que el ubigeo no esté vacio
  if (`${row[0]}` === '' || row[0] === null) {
    return `Fila ${index}: El campo ubigeo no puede estar vacio`
  }
  // Validamos que el nombre del centro de votación no esté vacio
  if (`${row[4]}` === '' || row[4] === null) {
    return `Fila ${index}: El campo local no puede estar vacio`
  }
  // Validamos que el número de mesa no esté vacio
  if (`${row[5]}` === '' || row[5] === null) {
    return `Fila ${index}: El campo número mesa no puede estar vacio`
  }
  // Validamos que el ubigeo tenga 6 dígitos
  if (`${row[0]}`.length !== 6) {
    return `Fila ${index}: El campo ubigeo debe tener 6 dígitos`
  }
  // Validamos que el ubigeo corresponda al departamento del usuario
  if (!superUser && `${row[0]}`.substring(0, 2) !== codigo) {
    return `Fila ${index}: El campo ubigeo debe comenzar con el código de departamento ${codigo}`
  }
  // Validamos que el número de mesa tenga 6 dígitos
  if (`${row[5]}`.length !== 6) {
    return `Fila ${index}: El campo número de mesa debe tener 6 dígitos`
  }
  // Obtenemos los datos del departamento si existe
  const departamento: IDepartamento | null = await Departamento.findOne({
    codigo: `${row[0]}`.substring(0, 2)
  })
  // Validamos que exista el departamento
  if (!departamento) {
    return `Fila ${index}: El departamento ${`${row[0]}`.substring(
      0,
      2
    )} no existe`
  }
  // Obtenemos los datos de la provincia si existe
  const provincia: IProvincia | null = await Provincia.findOne({
    codigo: `${row[0]}`.substring(2, 4),
    departamento: `${row[0]}`.substring(0, 2)
  })
  // Validamos que exista la provincia
  if (!provincia) {
    return `Fila ${index}: La provincia ${`${row[0]}`.substring(
      2,
      4
    )} no existe`
  }
  // Obtenemos los datos del distrito si existe
  const distrito: IDistrito | null = await Distrito.findOne({
    codigo: `${row[0]}`.substring(4, 6),
    provincia: `${row[0]}`.substring(2, 4),
    departamento: `${row[0]}`.substring(0, 2)
  })
  // Validamos que exista el distrito
  if (!distrito) {
    return `Fila ${index}: El distrito ${`${row[0]}`.substring(4, 6)} no existe`
  }
  // Si existe un número de mesa para el anho
  const mesaU: IMesa | null = await Mesa.findOne({
    mesa: `${row[5]}`,
    anho
  })
  if (mesaU) {
    return `Fila ${index}: El número de mesa ${row[5]}, ya se encuentra registrado para estas elecciones ${anho}`
  }
  // Si pasó todas las validaciones
  return 'ok'
}

/*******************************************************************************************************/
// Obtener todos los locales de votación (resumido) //
/*******************************************************************************************************/
export const getLocales: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para los locales
    let queryLocales = {}

    // Añadimos el año
    queryLocales = { ...queryLocales, anho: usuario.anho }
    // Si es un superusuario
    if (usuario.rol.super) {
      // Filtramos por el query de departamento
      if (query.departamento && query.departamento !== 'todos') {
        queryLocales = {
          ...queryLocales,
          ubigeo: { $regex: `^${query.departamento}.*` }
        }
      }
      // Filtramos por el query de provincia
      if (query.provincia && query.provincia !== 'todos') {
        queryLocales = {
          ...queryLocales,
          ubigeo: { $regex: `^${query.departamento}${query.provincia}.*` }
        }
      }
      // Filtramos por el query de distrito
      if (query.distrito && query.distrito !== 'todos') {
        queryLocales = {
          ...queryLocales,
          ubigeo: {
            $regex: `^${query.departamento}${query.provincia}${query.distrito}.*`
          }
        }
      }
    } else {
      // Filtramos por los que no son superusuarios
      queryLocales = {
        ...queryLocales,
        ubigeo: { $regex: `^${usuario.departamento?.codigo}.*` }
      }
      // Filtramos por el query de provincia
      if (query.provincia && query.provincia !== 'todos') {
        queryLocales = {
          ...queryLocales,
          ubigeo: {
            $regex: `^${usuario.departamento?.codigo}${query.provincia}.*`
          }
        }
      }
      // Filtramos por el query de distrito
      if (query.distrito && query.distrito !== 'todos') {
        queryLocales = {
          ...queryLocales,
          ubigeo: {
            $regex: `^${usuario.departamento?.codigo}${query.provincia}${query.distrito}.*`
          }
        }
      }
    }

    // Intentamos realizar la búsqueda de todos los locales agrupados
    const list: Array<IMesa> = await Mesa.aggregate([
      { $match: queryLocales },
      { $group: { _id: '$local' } },
      { $sort: { _id: 1 } }
    ])

    // Retornamos la lista de locales
    return res.json({
      status: true,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log(
      'Centros de Votación',
      'Obteniendo la lista de locales de votación',
      error
    )
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener los locales de votación'
    })
  }
}

/*******************************************************************************************************/
// Obtener todas las mesas de votación (resumido) //
/*******************************************************************************************************/
export const getMesas: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Definimos el query para las mesas
    let queryMesas = {}

    // Añadimos el año
    queryMesas = { ...queryMesas, anho: usuario.anho }
    // Si es un superusuario
    if (usuario.rol.super) {
      // Filtramos por el query de departamento
      if (query.departamento && query.departamento !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: { $regex: `^${query.departamento}.*` }
        }
      }
      // Filtramos por el query de provincia
      if (query.provincia && query.provincia !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: { $regex: `^${query.departamento}${query.provincia}.*` }
        }
      }
      // Filtramos por el query de distrito
      if (query.distrito && query.distrito !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: {
            $regex: `^${query.departamento}${query.provincia}${query.distrito}.*`
          }
        }
      }
    } else {
      // Filtramos por los que no son superusuarios
      queryMesas = {
        ...queryMesas,
        ubigeo: { $regex: `^${usuario.departamento?.codigo}.*` }
      }
      // Filtramos por el query de provincia
      if (query.provincia && query.provincia !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: {
            $regex: `^${usuario.departamento?.codigo}${query.provincia}.*`
          }
        }
      }
      // Filtramos por el query de distrito
      if (query.distrito && query.distrito !== 'todos') {
        queryMesas = {
          ...queryMesas,
          ubigeo: {
            $regex: `^${usuario.departamento?.codigo}${query.provincia}${query.distrito}.*`
          }
        }
      }
    }
    // Filtramos por el query de local
    if (query.local && query.local !== 'todos') {
      queryMesas = {
        ...queryMesas,
        local: query.local
      }
    }

    // Intentamos realizar la búsqueda de todos las mesas agrupadas
    const list: Array<IMesa> = await Mesa.aggregate([
      { $match: queryMesas },
      { $group: { _id: '$mesa' } },
      { $sort: { _id: 1 } }
    ])

    // Retornamos la lista de mesas
    return res.json({
      status: true,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log(
      'Centros de Votación',
      'Obteniendo la lista de mesas de votación',
      error
    )
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener las mesas de votación'
    })
  }
}
