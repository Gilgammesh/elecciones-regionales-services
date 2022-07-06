/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { verify, JwtPayload, VerifyErrors } from 'jsonwebtoken'
import { compare } from 'bcryptjs'
import Personero, { IPersonero } from '../../models/centro_votacion/personero'
import Eleccion, { IEleccion } from '../../models/eleccion'
import { generateToken, generateTokenWithTime } from '../../helpers/jwtoken'
import { parseJwtDateExpire } from '../../helpers/date'
import { tokenTimeApp, appSecret } from '../../configs'
import { IPersoneroResponse } from '../../middlewares/app/authentication'

/*******************************************************************************************************/
// Chequeamos el token del personero //
/*******************************************************************************************************/
export const check: Handler = async (req, res) => {
  // Leemos el cuerpo de la petición
  const { body } = req
  // Obtenemos el token de autorización
  const { token } = body

  // Si no existe el token
  if (!token || token === '') {
    return res.json({
      status: false,
      msg: 'Se debe proporcionar un token'
    })
  }

  try {
    // Intentamos verificar el token, con el texto secreto de la aplicación
    const decoded: JwtPayload = <JwtPayload>verify(token, appSecret)

    // Si existe una decodificación
    if (decoded?.personero?._id) {
      // Obtenemos los datos del personero actualizados
      const personero: IPersonero | null = await Personero.findById(
        decoded.personero._id
      ).populate('departamento')

      // Si existe el personero
      if (personero) {
        // Si el personero está activo
        if (personero.estado) {
          // Obtenemos los datos de las elecciones actuales
          const eleccion: IEleccion | null = await Eleccion.findOne({
            actual: true
          })

          // Definimos los datos del personero enviados en la respuesta
          const personeroResponse: IPersoneroResponse = {
            _id: personero._id,
            nombres: personero.nombres,
            apellidos: personero.apellidos,
            dni: personero.dni,
            celular: personero.celular,
            departamento: {
              _id: personero.departamento._id,
              codigo: personero.departamento.codigo,
              nombre: personero.departamento.nombre
            },
            ...(eleccion && { anho: eleccion.anho }),
            asignado: personero.asignado,
            tipo: personero.tipo
          }

          // Retornamos los datos del personero
          return res.json({
            status: true,
            personero: personeroResponse
          })
        } else {
          // Retornamos
          return res.json({
            status: false,
            msg: 'El personero está deshabilitado'
          })
        }
      } else {
        // Retornamos
        return res.json({
          status: false,
          msg: 'El personero ya no existe'
        })
      }
    }
  } catch (error: VerifyErrors | any) {
    // Capturamos los tipos de error en la vericación
    if (error.name === 'JsonWebTokenError') {
      // Mostramos el error en consola
      console.log('App Chequeando token', 'JsonWebTokenError', error.message)
      // Retornamos
      return res.json({
        status: false,
        msg: 'El token proporcionado es inválido'
      })
    }
    if (error.name === 'TokenExpiredError') {
      // Mostramos el error en consola
      console.log(
        'App Chequeando token',
        'TokenExpiredError',
        error.message,
        error.expiredAt
      )
      // Obtenemos la fecha de expiración casteada del token
      const msg: string = parseJwtDateExpire(error.expiredAt)
      // Retornamos
      return res.json({
        status: false,
        msg
      })
    }
    if (error.name === 'NotBeforeError') {
      // Mostramos el error en consola
      console.log(
        'App Chequeando token',
        'NotBeforeError',
        error.message,
        error.date
      )
      // Retornamos
      return res.json({
        status: false,
        msg: 'El token no está activo'
      })
    }
  }
}

/*******************************************************************************************************/
// Inicio de sesión del personero //
/*******************************************************************************************************/
export const login: Handler = async (req, res) => {
  // Leemos el cuerpo de la petición
  const { body } = req

  try {
    // Intentamos realizar la búsqueda por DNI del personero
    const personero: IPersonero | null = await Personero.findOne({
      dni: body.dni
    }).populate('departamento')

    // Verificamos si el personero existe
    if (!personero) {
      return res.json({
        status: false,
        msg: 'El personero no existe'
      })
    }

    // Verificamos si el personero está habilitado
    if (personero.estado === false) {
      return res.json({
        status: false,
        msg: 'El personero está deshabilitado'
      })
    }

    // Verificamos la contraseña del personero
    const pwdIsValid: boolean = await compare(body.password, personero.password)
    // Si no es válida
    if (pwdIsValid === false) {
      return res.json({
        status: false,
        msg: 'La contraseña no es válida'
      })
    }

    // Obtenemos los datos de las elecciones actuales
    const eleccion: IEleccion | null = await Eleccion.findOne({ actual: true })

    // Definimos los datos del personero enviados en la respuesta
    const personeroResponse: IPersoneroResponse = {
      _id: personero._id,
      nombres: personero.nombres,
      apellidos: personero.apellidos,
      dni: personero.dni,
      celular: personero.celular,
      departamento: {
        _id: personero.departamento._id,
        codigo: personero.departamento.codigo,
        nombre: personero.departamento.nombre
      },
      ...(eleccion && { anho: eleccion.anho }),
      asignado: personero.asignado,
      tipo: personero.tipo
    }

    // Definimos el objeto payload
    const payload: JwtPayload = {
      personero: {
        _id: personero._id
      }
    }

    // Generamos el token del personero
    const token: string | null = await generateTokenWithTime(
      payload,
      tokenTimeApp
    )

    // Retornamos el token y datos del personero
    return res.json({
      status: true,
      msg: 'Se inició la sesión correctamente',
      token: token ? token : '',
      personero: personeroResponse
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('App Login de personero:', error)
    // Retornamos
    return res.json({
      status: false,
      msg: 'Hubo un error en la validación del personero'
    })
  }
}

/*******************************************************************************************************/
// Generar token de un personero //
/*******************************************************************************************************/
export const token: Handler = async (req, res) => {
  // Leemos el cuerpo de la petición
  const { body } = req

  try {
    // Intentamos realizar la búsqueda por DNI del personero
    const personero: IPersonero | null = await Personero.findOne({
      dni: body.dni
    }).populate('departamento')

    // Verificamos si el personero existe
    if (!personero) {
      return res.json({
        status: false,
        msg: 'El personero no existe'
      })
    }

    // Verificamos si el personero está habilitado
    if (personero.estado === false) {
      return res.json({
        status: false,
        msg: 'El personero está deshabilitado'
      })
    }

    // Verificamos la contraseña del personero
    const pwdIsValid: boolean = await compare(body.password, personero.password)
    // Si no es válida
    if (pwdIsValid === false) {
      return res.json({
        status: false,
        msg: 'La contraseña no es válida'
      })
    }

    // Obtenemos los datos de las elecciones actuales
    const eleccion: IEleccion | null = await Eleccion.findOne({ actual: true })

    // Definimos los datos del personero enviados en la respuesta
    const personeroResponse: IPersoneroResponse = {
      _id: personero._id,
      nombres: personero.nombres,
      apellidos: personero.apellidos,
      dni: personero.dni,
      celular: personero.celular,
      departamento: {
        _id: personero.departamento._id,
        codigo: personero.departamento.codigo,
        nombre: personero.departamento.nombre
      },
      ...(eleccion && { anho: eleccion.anho }),
      asignado: personero.asignado,
      tipo: personero.tipo
    }

    // Definimos el objeto payload
    const payload: JwtPayload = {
      personero: {
        _id: personero._id
      }
    }

    // Generamos el token del personero
    let token: string | null
    // Si el token expira
    if (body.expires) {
      // Generamos un token con el tiempo de expiración
      token = await generateTokenWithTime(payload, body.time)
    } else {
      // Generamos un token indefinido que no caduca
      token = await generateToken(payload)
    }

    // Retornamos el token
    return res.json({
      status: true,
      msg: 'Se generó el token correctamente',
      token
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('App Auth', 'Generando token de personero', error)
    // Retornamos
    return res.json({
      status: false,
      msg: 'No se pudo generar el token del personero'
    })
  }
}
