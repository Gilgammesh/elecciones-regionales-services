/***************************************************************************************************************/
// Importamos las dependencias //
/***************************************************************************************************************/
import { createServer } from 'http'
import { platform } from 'os'
import 'moment/locale/es'
import 'colors'
import app from './app'
import { connection as mongoDbConn } from './db/mongodb'
import sockets from './sockets'
import { appEnvironment, appHost, appNombre, appPort } from './configs'

/***************************************************************************************************************/
// Creamos el Servidor HTTP //
/***************************************************************************************************************/
const httpServer = createServer(app)

/***************************************************************************************************************/
// Inicializamos el Servidor Socket IO //
/***************************************************************************************************************/
sockets(httpServer)

/***************************************************************************************************************/
// Arrancamos el Servidor HTTP con Express //
/***************************************************************************************************************/
httpServer.listen(appPort, () => {
  console.log(`*** ${appNombre.toLocaleUpperCase()} ***`.cyan.bold)
  if (appEnvironment === 'development') {
    console.log(
      `🚀 ${platform().toUpperCase()} Servidor (${appEnvironment}) => Listo en: `.yellow.bold.toString() +
        `${appHost}:${appPort}   `.white.bold
    )
  }
  if (appEnvironment === 'production') {
    console.log(
      `🚀 ${platform().toUpperCase()} Servidor (${appEnvironment}), listo en: `.yellow.bold.toString() +
        `${appHost}   `.white.bold
    )
  }
  // Nos conectamos a la Base de Datos MongoDB
  mongoDbConn()
})
