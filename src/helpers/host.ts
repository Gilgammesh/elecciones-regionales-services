/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { appEnvironment, appHost, appPort } from '../configs'

/*******************************************************************************************************/
// Función para obtener el nombre del host (Según el entorno de la aplicación) //
/*******************************************************************************************************/
export const getHost = () => {
  // Nombre del host
  let host: string = ''
  if (appEnvironment === 'development') {
    host = `${appHost}:${appPort}`
  }
  if (appEnvironment === 'production') {
    host = `${appHost}`
  }
  // Retornamos
  return host
}

/*******************************************************************************************************/
// Función para obtener la ruta de uploads (Según el entorno de la aplicación) //
/*******************************************************************************************************/
export const getPathUpload = () => {
  // Nombre de la ruta
  let path: string = ''
  if (appEnvironment === 'development') {
    path = `${appHost}:${appPort}/uploads`
  }
  if (appEnvironment === 'production') {
    path = `${appHost}/uploads`
  }
  // Retornamos
  return path
}
