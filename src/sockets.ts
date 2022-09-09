/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Server as HttpServer } from 'http'
import { Socket, Server as WebsocketServer } from 'socket.io'
import {
  verify,
  JwtPayload,
  NotBeforeError,
  TokenExpiredError,
  JsonWebTokenError
} from 'jsonwebtoken'
import moment from 'moment-timezone'
import { appSecret, corsOptions, timeZone } from './configs'
import Sesion, { ISesion } from './models/admin/sesion'

/*******************************************************************************************************/
// Función para Crear e Inicializar el servidor Socket IO //
/*******************************************************************************************************/
const sockets = (httpServer: HttpServer) => {
  /////////////////////////////////////////////////////////////////////////////////////
  // Creamos el Servidor SocketIO => pasamos el servidor http y las opciones de cors //
  /////////////////////////////////////////////////////////////////////////////////////
  const io = new WebsocketServer(httpServer, {
    cors: corsOptions
  })
  // Guardamos el servidor socketIO como variable global
  globalThis.socketIO = io

  ///////////////////////////////////////////////////////////////////
  // Middleware para autenticar el token enviado con el socket     //
  ///////////////////////////////////////////////////////////////////
  io.use((socket, next) => {
    // Obtenemos el token de autorización del websocket
    const { token } = socket.handshake.auth

    // Si existe un token verificamos
    if (token && token !== '') {
      try {
        // Intentamos verificar el token, con el texto secreto de la aplicación
        verify(token, appSecret)
        // Pasamos a la siguiente función
        next()
      } catch (error: unknown) {
        // Si existe un error
        if (error instanceof JsonWebTokenError && error.name === 'JsonWebTokenError') {
          // Mostramos el error en consola
          console.log('Autenticando token Socket Middleware', 'JsonWebTokenError', error.message)
          // Generamos el error
          next(new Error(`El token proporcionado es inválido`))
        }
        if (
          error instanceof TokenExpiredError &&
          error.name === 'TokenExpiredError' &&
          error.expiredAt
        ) {
          // Mostramos el error en consola
          console.log(
            'Autenticando token Socket Middleware',
            'TokenExpiredError',
            error.message,
            error.expiredAt
          )
          // Construimos la fecha y hora
          const date = moment(error.expiredAt).tz(timeZone)
          const dayNro = date.format('DD')
          const monthName = date.format('MMMM')
          const year = date.format('YYYY')
          const fecha = `${dayNro} de ${monthName} de ${year}`
          const hora = date.format('hh:mm:ss a')
          // Generamos el error
          next(new Error(`El token proporcionado ha expirado el ${fecha} a las ${hora}`))
        }
        if (error instanceof NotBeforeError && error.name === 'NotBeforeError') {
          // Mostramos el error en consola
          console.log(
            'Autenticando token Socket Middleware',
            'NotBeforeError',
            error.message,
            error.date
          )
          // Generamos el error
          next(new Error(`El token no está activo`))
        }
      }
    }
    // Si no existe token
    else {
      // Desconectamos el socket
      socket.disconnect()
      // Generamos el error
      next(new Error('Se debe proporcionar un token'))
    }
  })

  //////////////////////////////////////////////////////////
  // Evento cuando se establece la conexión con el socket //
  //////////////////////////////////////////////////////////
  io.on('connection', async (socket: Socket) => {
    // Obtenemos el token de autorización del websocket
    const { token, source, ip, device, browser } = socket.handshake.auth
    const decoded: JwtPayload = <JwtPayload>verify(token, appSecret)

    if (decoded && decoded.usuario) {
      // Mostramos la conexión iniciada
      console.log(
        'Cliente Web',
        socket.id,
        '->',
        'Usuario',
        decoded.usuario._id,
        '->',
        'conectado',
        socket.connected
      )
      // Suscribimos al socket al room intranet
      socket.join('intranet')

      // Realizamos la búsqueda en sesión con el id del usuario
      const sesion: ISesion | null = await Sesion.findOne({ usuario: decoded.usuario._id })
      // Si existe una sesíon
      if (sesion) {
        // Realizamos la búsqueda por id y actualizamos
        await Sesion.findOneAndUpdate(
          { usuario: decoded.usuario._id },
          {
            $set: {
              socketId: socket.id as string,
              fuente: source as string,
              ip: ip as string,
              dispositivo: device as string,
              navegador: browser as string,
              estado: 'online'
            }
          }
        )
        // Emitimos los eventos
        io.to(sesion.socketId).emit('admin-sesion-cerrada')
        io.to('intranet').emit('admin-sesion-actualizada')
      } else {
        // Creamos el modelo de una nueva sesión y guardamos
        const newSesion: ISesion = new Sesion({
          usuario: decoded.usuario._id,
          socketId: socket.id as string,
          fuente: source as string,
          ip: ip as string,
          dispositivo: device as string,
          navegador: browser as string
        })
        await newSesion.save()
        // Emitimos los eventos
        io.to('intranet').emit('admin-sesion-creada')
      }

      // Mostramos la desconexión
      socket.on('disconnect', async () => {
        console.log(
          'Cliente Web',
          socket.id,
          '->',
          'Usuario',
          decoded.usuario._id,
          '->',
          'desconectado',
          socket.disconnected
        )
        // Realizamos la búsqueda por id y actualizamos
        await Sesion.findOneAndUpdate(
          { usuario: decoded.usuario._id },
          {
            $set: {
              estado: 'offline'
            }
          }
        )
        // Emitimos los eventos
        io.to('intranet').emit('admin-sesion-actualizada')
      })
    }
    if (decoded && decoded.personero) {
      // Mostramos la conexión iniciada
      console.log(
        'Cliente App',
        socket.id,
        '->',
        'Personero',
        decoded.personero._id,
        '->',
        'conectado',
        socket.connected
      )
      // Suscribimos al socket al room app
      socket.join('app')

      // Mostramos la desconexión
      socket.on('disconnect', () => {
        console.log(
          'Cliente App',
          socket.id,
          '->',
          'Personero',
          decoded.personero._id,
          '->',
          'desconectado',
          socket.disconnected
        )
      })
    }
  })
}

/*******************************************************************************************************/
// Exportamos la función //
/*******************************************************************************************************/
export default sockets
