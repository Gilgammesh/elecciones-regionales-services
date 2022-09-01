/*******************************************************************************************************/
// Requerimos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { verify, JwtPayload, VerifyErrors } from 'jsonwebtoken'
import Personero, { IPersonero } from '../../models/centro_votacion/personero'
import Eleccion, { IEleccion } from '../../models/eleccion'
import { parseJwtDateExpire } from '../../helpers/date'
import { appSecret } from '../../configs'

/*******************************************************************************************************/
// Interface de Personero Response //
/*******************************************************************************************************/
export interface IPersoneroResponse {
  _id: string
  nombres?: string
  apellidos?: string
  dni?: string
  celular?: string
  departamento?: {
    _id: string
    codigo: string
    nombre?: string
  }
  anho?: number
  fecha?: string
  asignado?: boolean
  tipo?: string
}

/*******************************************************************************************************/
// Validamos y decodificamos el jsonwebtoken en la petición  //
/*******************************************************************************************************/
export const validarToken: Handler = async (req, res, next) => {
  // Leemos los headers de la petición
  const { headers } = req
  // Obtenemos la cabecera de autorización
  const { authorization } = headers

  // Si no existe el authorization
  if (!authorization || authorization === '') {
    return res.json({
      status: false,
      msg: 'Se debe proporcionar un token'
    })
  }

  // Obtenemos el token desde la Autorización
  const token: string = <string>authorization

  try {
    // Intentamos verificar el token, con el texto secreto de la aplicación
    const decoded: JwtPayload = <JwtPayload>verify(token, appSecret)

    // Si existe una decodificación
    if (decoded?.personero?._id) {
      // Obtenemos los datos del personero actualizados
      const personero: IPersonero | null = await Personero.findById(decoded.personero._id).populate(
        'departamento'
      )

      // Si existe el personero
      if (personero) {
        // Si el personero está activo
        if (personero.estado) {
          // Obtenemos los datos de las elecciones actuales
          const eleccion: IEleccion | null = await Eleccion.findOne({
            actual: true
          })

          // Definimos los datos del personero
          const personeroResponse: IPersoneroResponse = {
            _id: personero._id,
            tipo: personero.tipo,
            departamento: {
              _id: personero.departamento._id,
              codigo: personero.departamento.codigo
            },
            anho: eleccion?.anho,
            fecha: eleccion?.fecha
          }

          // Almacenamos los datos del personero actualizado en el request
          req.personero = personeroResponse
          // Pasamos a la siguiente función
          next()
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
      console.log('App Autenticando token Middleware', 'JsonWebTokenError', error.message)
      // Retornamos
      return res.json({
        status: false,
        msg: 'El token proporcionado es inválido'
      })
    }
    if (error.name === 'TokenExpiredError') {
      // Mostramos el error en consola
      console.log(
        'App Autenticando token Middleware',
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
      console.log('App Autenticando token Middleware', 'NotBeforeError', error.message, error.date)
      // Retornamos
      return res.json({
        status: false,
        msg: 'El token no está activo'
      })
    }
  }
}
