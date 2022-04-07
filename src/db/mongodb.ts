/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import mongoose, { ConnectOptions } from 'mongoose';
import 'colors';
import { appEnvironment, dbDriver, dbHost, dbName, dbUser, dbPwd, dbPort } from '../configs';

/*******************************************************************************************************/
// Creamos la conexión a la Base de Datos MongoDB //
/*******************************************************************************************************/
const connection = async () => {
	// Propiedades en la cadena de conexión
	let properties: string = 'retryWrites=true&w=majority';
	if (dbUser !== '' && dbPwd !== '') {
		properties = 'authSource=admin&retryWrites=true&w=majority';
	}
	// URI de acceso a la Base de Datos
	const URI: string = `${dbDriver}://${dbHost}:${dbPort}/${dbName}?${properties}`;

	// Definimos las opciones de conexión a la base de datos
	const mongooseOptions: ConnectOptions = {
		// Construye index definidos en nuestros esquemas cuando se conecta (ideal en producción)
		autoIndex: appEnvironment === 'development' ? true : false,
		maxPoolSize: 10, // Mantener hasta n conexiones de sockets
		serverSelectionTimeoutMS: 5000, // Continua intentando enviar operaciones durante n segundos
		socketTimeoutMS: 45000, // Cierra sockets después de n segundos de inactividad.
		family: 4, // Usa IPv4, Omite a IPv6
		user: dbUser, // Pasamos el usuario
		pass: dbPwd // Pasamos la contraseña
	};

	// Intentamos conectarnbos a la base de datos
	try {
		await mongoose.connect(URI, mongooseOptions);
		console.log(`Conexión exitosa a MongoDB  `.green.bold.toString());
		console.log(`💽 Base de datos: `.yellow.bold.toString() + `${dbName}   `.white.bold);
		console.log('********************************************************************************'.rainbow);
	} catch (error) {
		// En caso de error mostramos
		console.log('Error en la conexión:  '.white.bold);
		console.log(error);
		console.log('********************************************************************************'.rainbow);
	}
};

/*******************************************************************************************************/
// Exportamos la conexión a la base de datos por defecto //
/*******************************************************************************************************/
export default connection;
