/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { SwaggerOptions } from 'swagger-ui-express';
import { appNombre, appDescripcion, appEnvironment, appAutorName, appAutorEmail, appAutorWeb } from '../configs';
import { getHost } from '../helpers/host';
import routes from '../routes';

/*******************************************************************************************************/
// Variables de las opciones //
/*******************************************************************************************************/
const tags = routes.map(ele => {
	return {
		name: ele.name,
		description: ele.description,
		externalDocs: {
			description: 'Ir',
			url: `${getHost()}/docs${ele.path}`
		}
	};
});

/*******************************************************************************************************/
// Opciones de SWAGGER //
/*******************************************************************************************************/
export const options: SwaggerOptions = {
	openapi: '3.0.0',
	info: {
		title: appNombre,
		description: `Esquemas de los ${appDescripcion}`,
		version: '1.0.0',
		contact: {
			name: appAutorName,
			email: appAutorEmail,
			url: appAutorWeb
		}
	},
	servers: [
		{
			url: getHost(),
			description: appEnvironment === 'development' ? 'Servidor Local' : 'Servidor Producción'
		}
	],
	tags
};
