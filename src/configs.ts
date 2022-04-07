/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import * as dotenv from 'dotenv';
import { CorsOptions } from 'cors';

/*******************************************************************************************************/
// Habilitamos las variables de entorno //
/*******************************************************************************************************/
dotenv.config();

/*******************************************************************************************************/
// Variables de la Aplicación //
/*******************************************************************************************************/
export const appEnvironment: string = process.env.APP_ENVIRONMENT || 'development'; // Entorno de la Aplicación
export const appHost: string = process.env.APP_ELEC_HOST || 'localhost'; // Host de la Aplicación
export const appNombre: string = process.env.APP_ELEC_NAME || ''; // Nombre de la aplicación
export const appDescripcion: string = process.env.APP_ELEC_DESCRIPTION || ''; // Descripción de la aplicación
export const appPort: number = parseInt(process.env.APP_ELEC_PORT as string, 10) || 3000; // Puerto de la aplicación
export const appSecret: string = process.env.APP_ELEC_SECRET_TEXT || ''; // Texto secreto de la aplicación
export const appAutorName: string = process.env.APP_ELEC_AUTHOR_NAME || ''; // Nombre o Compañia Autor de la aplicación
export const appAutorDev: string = process.env.APP_ELEC_AUTHOR_DEV_NAME || ''; // Desarrollador de la aplicación
export const appAutorEmail: string = process.env.APP_ELEC_AUTHOR_EMAIL || ''; // Correo del Autor de la aplicación
export const appAutorWeb: string = process.env.APP_ELEC_AUTHOR_WEB || ''; // Web del Autor de la aplicación

/*******************************************************************************************************/
// Variables de la Base de Datos MongoDB //
/*******************************************************************************************************/
export const dbDriver: string = process.env.APP_MONGO_DB_DRIV || 'mongodb'; // Driver de la base de datos
export const dbHost: string = process.env.APP_MONGO_DB_HOST || 'localhost'; // Host de la base de datos
export const dbPort: number = parseInt(process.env.APP_MONGO_DB_PORT as string, 10) || 27017; // Puerto de la base de datos
export const dbName: string = process.env.APP_MONGO_DB_NAME_ELEC || 'test'; // Nombre de la base de datos
export const dbUser: string = process.env.APP_MONGO_DB_USER || ''; // Usuario de la base de datos
export const dbPwd: string = process.env.APP_MONGO_DB_PWD || ''; // Contraseña de la base de datos

/*******************************************************************************************************/
// Configuraciones Generales de la Aplicación //
/*******************************************************************************************************/
export const locale: string = 'es-PE'; // Locale para la zona horaria
export const tokenTime: string = '7d'; // Tiempo de expiración de los JsonWebToken generados en el auth Login
export const timeZone: string = 'America/Lima'; // Zona horaria la aplicación

/*******************************************************************************************************/
// Opciones de CORS //
/*******************************************************************************************************/
export const corsOptions: CorsOptions = {
	origin: '*',
	methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
	allowedHeaders: ['Authorization', 'Content-Type', 'Source', 'Origin', 'Ip', 'Device', 'Browser']
};