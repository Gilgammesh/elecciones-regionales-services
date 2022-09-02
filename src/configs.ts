/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import * as dotenv from 'dotenv'
import { CorsOptions } from 'cors'

/*******************************************************************************************************/
// Habilitamos las variables de entorno //
/*******************************************************************************************************/
dotenv.config()

/*******************************************************************************************************/
// Variables de la Aplicación //
/*******************************************************************************************************/
export const appEnvironment: string = process.env.APP_ENVIRONMENT || 'development'
export const appHost: string = process.env.APP_ELEC_HOST || 'localhost'
// export const appHost: string = process.env.APP_ELEC_HOST_ || 'localhost'
export const appNombre: string = process.env.APP_ELEC_NAME || ''
export const appDescripcion: string = process.env.APP_ELEC_DESCRIPTION || ''
export const appPort: number = parseInt(process.env.APP_ELEC_PORT as string, 10) || 3000
// export const appPort: number = parseInt(process.env.APP_ELEC_PORT_ as string, 10) || 3000
export const appSecret: string = process.env.APP_ELEC_SECRET_TEXT || ''
export const appAutorName: string = process.env.APP_ELEC_AUTHOR_NAME || ''
/*******************************************************************************************************/
// Variables de la Base de Datos MongoDB //
/*******************************************************************************************************/
export const dbDriver: string = process.env.APP_MONGO_DB_DRIV || 'mongodb'
export const dbHost: string = process.env.APP_MONGO_DB_HOST || 'localhost'
export const dbPort: number = parseInt(process.env.APP_MONGO_DB_PORT as string, 10) || 27017
export const dbUser: string = process.env.APP_MONGO_DB_USER || ''
export const dbPwd: string = process.env.APP_MONGO_DB_PWD || ''
export const dbName: string = process.env.APP_MONGO_DB_NAME_ELEC || 'test'
// export const dbName: string = process.env.APP_MONGO_DB_NAME_ELEC_ || 'test'

/*******************************************************************************************************/
// Configuraciones Generales de la Aplicación //
/*******************************************************************************************************/
// Locale para la zona horaria
export const locale = 'es-PE'
// Tiempo de expiración en el auth Login de la Intranet
export const tokenTime = '7d'
// Tiempo de expiración auth Login de la App de Personeros
export const tokenTimeApp = '7d'
// Zona horaria la aplicación
export const timeZone = 'America/Lima'

/*******************************************************************************************************/
// Opciones de CORS //
/*******************************************************************************************************/
export const corsOptions: CorsOptions = {
  origin: '*',
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Source', 'Origin', 'Ip', 'Device', 'Browser']
}
