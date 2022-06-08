/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Server as HttpServer } from 'http'
import { Socket, Server } from 'socket.io'
import jwt, { VerifyErrors } from 'jsonwebtoken'
import moment from 'moment-timezone'
import { appSecret, corsOptions, timeZone } from '../configs'

/*******************************************************************************************************/
// Función para Crear e Inicializar el servidor Socket IO //
/*******************************************************************************************************/
const sockets = (httpServer: HttpServer) => {
  /////////////////////////////////////////////////////////////////////////////////////
  // Creamos el Servidor SocketIO => pasamos el servidor http y las opciones de cors //
  /////////////////////////////////////////////////////////////////////////////////////
  const io = new Server(httpServer, {
    cors: corsOptions
  })

  ///////////////////////////////////////////////////////////////////
  // Middleware para authenticacion el token enviado con el socket //
  ///////////////////////////////////////////////////////////////////
  io.use((socket, next) => {
    // Obtenemos el token de autorización del websocket
    const { token } = socket.handshake.auth

    // Si existe un token verificamos
    if (token && token !== '') {
      try {
        // Intentamos verificar el token, con el texto secreto de la aplicación
        jwt.verify(token, appSecret)
        // Pasamos a la siguiente función
        next()
      } catch (error: VerifyErrors | any) {
        // Si existe un error
        if (error.name === 'JsonWebTokenError') {
          // Mostramos el error en consola
          console.log(
            'Autenticando token Socket Middleware',
            'JsonWebTokenError',
            error.message
          )
          // Generamos el error
          next(new Error(`El token proporcionado es inválido`))
        }
        if (error.name === 'TokenExpiredError' && error.expiredAt) {
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
          next(
            new Error(
              `El token proporcionado ha expirado el ${fecha} a las ${hora}`
            )
          )
        }
        if (error.name === 'NotBeforeError') {
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
  io.on('connection', (socket: Socket) => {
    // Mostramos la conexión iniciada
    console.log('Cliente', socket.id, '->', 'conectado', socket.connected)

    // Emitimos el evento => sesión actualizada en el módulo monitor, a todos los usuarios conectados //
    socket.broadcast.emit('monitor-sesion-actualizada')

    // Mostramos la desconexión
    socket.on('disconnect', () => {
      console.log(
        'Cliente',
        socket.id,
        '->',
        'desconectado',
        socket.disconnected
      )
    })

    // Pasamos el valor del socket a la variable global socketIO
    globalThis.socketIO = socket
  })
}

/*******************************************************************************************************/
// Exportamos la función //
/*******************************************************************************************************/
export default sockets
