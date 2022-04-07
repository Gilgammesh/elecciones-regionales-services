/***************************************************************************************************************/
// Importamos las dependencias //
/***************************************************************************************************************/
import { createServer } from 'http';
import { platform } from 'os';
import { textSync } from 'figlet';
import 'moment/locale/es';
import 'colors';
import app from './app';
import mongodb from './db/mongodb';
import sockets from './sockets';
import { appAutorName, appEnvironment, appHost, appNombre, appPort } from './configs';

/***************************************************************************************************************/
// Nos conectamos a la Base de Datos MongoDB //
/***************************************************************************************************************/
mongodb();

/***************************************************************************************************************/
// Creamos el Servidor HTTP //
/***************************************************************************************************************/
const httpServer = createServer(app);

/***************************************************************************************************************/
// Inicializamos el Servidor Socket IO //
/***************************************************************************************************************/
sockets(httpServer);

/***************************************************************************************************************/
// Arrancamos el Servidor HTTP con Express //
/***************************************************************************************************************/
httpServer.listen(appPort, () => {
	console.log('********************************************************************************'.rainbow);
	console.log(textSync(appAutorName).blue.bold);
	console.log('********************************************************************************'.rainbow);
	console.log(`*** ${appNombre} ***`.cyan.bold);
	console.log('********************************************************************************'.rainbow);
	if (appEnvironment === 'development') {
		console.log(
			`🚀 ${platform().toUpperCase()} Servidor (${appEnvironment}) => Listo en: `.yellow.bold.toString() +
				`${appHost}:${appPort}   `.white.bold
		);
	}
	if (appEnvironment === 'production') {
		console.log(
			`🚀 ${platform().toUpperCase()} Servidor (${appEnvironment}), listo en: `.yellow.bold.toString() +
				`${appHost}   `.white.bold
		);
	}
	console.log('********************************************************************************'.rainbow);	
});
