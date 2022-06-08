/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { compare } from 'bcryptjs'
import Usuario, { IUsuario } from '../../models/usuario'
import Eleccion, { IEleccion } from '../../models/eleccion'
import { generateToken, generateTokenWithTime } from '../../helpers/jwtoken'
import { IUsuarioResponse } from '../../middlewares/authentication'

/*******************************************************************************************************/
// Generar token de un usuario //
/*******************************************************************************************************/
export const generate: Handler = async (req, res) => {
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
    let token: string | null
    // Si el token expira
    if (body.expires) {
      // Generamos un token con el tiempo de expiración
      token = await generateTokenWithTime(payload, body.time)
    }
    // Caso contrario
    else {
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
