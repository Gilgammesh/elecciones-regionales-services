/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import {
  verify,
  JwtPayload,
  NotBeforeError,
  TokenExpiredError,
  JsonWebTokenError
} from 'jsonwebtoken'
import { compare } from 'bcryptjs'
import Usuario, { IUsuario } from '../../models/usuario'
import Modulo, { IModulo } from '../../models/admin/modulo'
import Eleccion, { IEleccion } from '../../models/eleccion'
import { generateToken, generateTokenWithTime } from '../../helpers/jwtoken'
import { tokenTime, appSecret } from '../../configs'
import { parseJwtDateExpire } from '../../helpers/date'
import { IUsuarioResponse } from '../../middlewares/authentication'

/*******************************************************************************************************/
// Chequeamos el token del usuario //
/*******************************************************************************************************/
export const check: Handler = async (req, res) => {
  // Leemos el cuerpo de la petición
  const { body } = req
  // Obtenemos la cabecera de autorización
  const { token } = body

  // Si no existe el token
  if (!token || token === '') {
    return res.status(401).json({
      status: false,
      msg: 'Se debe proporcionar un token'
    })
  }

  try {
    // Intentamos verificar el token, con el texto secreto de la aplicación
    const decoded: JwtPayload = <JwtPayload>verify(token, appSecret)

    // Si existe una decodificación
    if (decoded?.usuario?._id) {
      // Obtenemos los datos del usuario actualizados
      const usuario: IUsuario | null = await Usuario.findById(decoded.usuario._id)
        .populate('rol')
        .populate('departamento')

      // Si existe el usuario
      if (usuario) {
        // Si el usuario está activo
        if (usuario.estado) {
          // Obtenemos los datos de las elecciones actuales
          const eleccion: IEleccion | null = await Eleccion.findOne({
            actual: true
          })

          // Definimos los datos del usuario enviados en la respuesta
          const usuarioResponse: IUsuarioResponse = {
            _id: usuario._id,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            dni: usuario.dni,
            genero: usuario.genero,
            img: usuario.img,
            rol: {
              _id: usuario.rol._id,
              super: usuario.rol.super
            },
            ...(!usuario.rol.super && {
              departamento: {
                _id: usuario.departamento._id,
                codigo: usuario.departamento.codigo,
                nombre: usuario.departamento.nombre
              }
            }),
            ...(eleccion && { anho: eleccion.anho })
          }

          // Sacamos la lista de todos los módulos
          const modulos: Array<IModulo> = await Modulo.find({}, '-createdAt -updatedAt').sort({
            orden: 'asc'
          })

          // Retornamos los datos del usuario y permisos
          return res.json({
            status: true,
            usuario: usuarioResponse,
            permisos: usuario.rol.permisos,
            modulos
          })
        } else {
          // Retornamos
          return res.status(403).json({
            status: false,
            msg: 'El usuario está deshabilitado'
          })
        }
      } else {
        // Retornamos
        return res.status(403).json({
          status: false,
          msg: 'El usuario ya no existe'
        })
      }
    }
  } catch (error: unknown) {
    // Capturamos los tipos de error en la vericación
    if (error instanceof JsonWebTokenError && error.name === 'JsonWebTokenError') {
      // Mostramos el error en consola
      console.log('Chequeando token', 'JsonWebTokenError', error.message)
      // Retornamos
      return res.status(401).json({
        status: false,
        msg: 'El token proporcionado es inválido'
      })
    }
    if (error instanceof TokenExpiredError && error.name === 'TokenExpiredError') {
      // Mostramos el error en consola
      console.log('Chequeando token', 'TokenExpiredError', error.message, error.expiredAt)
      // Obtenemos la fecha de expiración casteada del token
      const msg: string = parseJwtDateExpire(error.expiredAt)
      // Retornamos
      return res.status(401).json({
        status: false,
        msg
      })
    }
    if (error instanceof NotBeforeError && error.name === 'NotBeforeError') {
      // Mostramos el error en consola
      console.log('Chequeando token', 'NotBeforeError', error.message, error.date)
      // Retornamos
      return res.status(401).json({
        status: false,
        msg: 'El token no está activo'
      })
    }
  }
}

/*******************************************************************************************************/
// Inicio de sesión del usuario //
/*******************************************************************************************************/
export const login: Handler = async (req, res) => {
  // Leemos el cuerpo de la petición
  const { body } = req

  try {
    // Intentamos realizar la búsqueda por DNI del usuario
    const usuario: IUsuario | null = await Usuario.findOne({ dni: body.dni })
      .populate('rol')
      .populate('departamento')

    // Verificamos si el usuario existe
    if (!usuario) {
      return res.status(401).json({
        status: false,
        msg: 'El usuario no existe'
      })
    }

    // Verificamos si el usuario está habilitado
    if (usuario.estado === false) {
      return res.status(403).json({
        status: false,
        msg: 'El usuario está deshabilitado'
      })
    }

    // Verificamos la contraseña del usuario
    const pwdIsValid: boolean = await compare(body.password, usuario.password)
    // Si no es válida
    if (pwdIsValid === false) {
      return res.status(401).json({
        status: false,
        msg: 'La contraseña no es válida'
      })
    }

    // Obtenemos los datos de las elecciones actuales
    const eleccion: IEleccion | null = await Eleccion.findOne({ actual: true })

    // Definimos los datos del usuario enviados en la respuesta
    const usuarioResponse: IUsuarioResponse = {
      _id: usuario._id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      dni: usuario.dni,
      genero: usuario.genero,
      img: usuario.img,
      rol: {
        _id: usuario.rol._id,
        super: usuario.rol.super
      },
      ...(!usuario.rol.super && {
        departamento: {
          _id: usuario.departamento._id,
          codigo: usuario.departamento.codigo,
          nombre: usuario.departamento.nombre
        }
      }),
      ...(eleccion && { anho: eleccion.anho })
    }

    // Definimos el objeto payload
    const payload: JwtPayload = {
      usuario: {
        _id: usuario._id
      }
    }

    // Generamos el token del usuario
    const token: string | null = await generateTokenWithTime(payload, tokenTime)

    // Sacamos la lista de todos los módulos
    const modulos: Array<IModulo> = await Modulo.find({}, '-createdAt -updatedAt').sort({
      orden: 'asc'
    })

    // Retornamos el token, datos y permisos del usuario
    return res.json({
      status: true,
      msg: 'Se inició la sesión correctamente',
      token: token ? token : '',
      usuario: usuarioResponse,
      permisos: usuario.rol.permisos,
      modulos
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Login de usuario:', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'Hubo un error en la validación del usuario'
    })
  }
}

/*******************************************************************************************************/
// Generar token de un usuario //
/*******************************************************************************************************/
export const token: Handler = async (req, res) => {
  // Leemos el cuerpo de la petición
  const { body } = req

  try {
    // Intentamos realizar la búsqueda por DNI del usuario
    const usuario: IUsuario | null = await Usuario.findOne({ dni: body.dni })
      .populate('rol')
      .populate('departamento')

    // Verificamos si el usuario existe
    if (!usuario) {
      return res.status(401).json({
        status: false,
        msg: 'El usuario no existe'
      })
    }

    // Verificamos si el usuario está habilitado
    if (usuario.estado === false) {
      return res.status(403).json({
        status: false,
        msg: 'El usuario está desactivado'
      })
    }

    // Verificamos la contraseña del usuario
    const pwdIsValid: boolean = await compare(body.password, usuario.password)
    // Si no es válida
    if (pwdIsValid === false) {
      return res.status(401).json({
        status: false,
        msg: 'La contraseña no es válida'
      })
    }

    // Definimos el objeto payload
    const payload: JwtPayload = {
      usuario: {
        _id: usuario._id
      }
    }

    // Generamos el token del usuario
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
    console.log('Auth', 'Generando token de usuario', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo generar el token del usuario'
    })
  }
}
