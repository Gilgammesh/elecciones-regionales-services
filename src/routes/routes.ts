/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express';
import { SwaggerOptions } from 'swagger-ui-express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import usuariosRoutes from './usuarios.routes';
import eleccionesRoutes from './elecciones.routes';
import ubigeoRoutes from './ubigeo.routes';
import { options } from '../swagger/setup';
import { options as adminOptions } from '../swagger/admin.options';
import { options as authOptions } from '../swagger/auth.options';

/*******************************************************************************************************/
// Interface de Rutas //
/*******************************************************************************************************/
interface IRoutes {
	name: string;
	description?: string;
	path: string;
	router: Router;
	swaggerOptions: SwaggerOptions;
}

/*******************************************************************************************************/
// Definimos las rutas principales de los Servicios //
/*******************************************************************************************************/
const routes: Array<IRoutes> = [
	{
		name: 'Ubigeo',
		description: 'Esquema para gestionar el ubigeo de la App',
		path: '/ubigeo',
		router: ubigeoRoutes,
		swaggerOptions: options
	},
	{
		name: 'Administrativo',
		description: 'Esquema para la gestion administrativa de la App',
		path: '/admin',
		router: adminRoutes,
		swaggerOptions: adminOptions
	},
	{
		name: 'Autenticación',
		description: 'Esquema para la autenticación de los usuarios de la App',
		path: '/auth',
		router: authRoutes,
		swaggerOptions: authOptions
	},
	{
		name: 'Elecciones',
		description: 'Esquema para gestionar los años electorales',
		path: '/elecciones',
		router: eleccionesRoutes,
		swaggerOptions: options
	},
	{
		name: 'Usuarios',
		description: 'Esquema para gestionar los usuarios de la App',
		path: '/usuarios',
		router: usuariosRoutes,
		swaggerOptions: options
	},
	/* {
		name: 'Organizaciones Políticas',
		description: 'Esquema para gestionar las organizaciones políticas de las elecciones',
		path: '/organizaciones-politicas',
		router: ,
		swaggerOptions: options
	}, */
	{
		name: 'Centros de Votación',
		description: 'Esquema para gestionar los centros de votación de las elecciones',
		path: '/centros-votacion',
		router: ubigeoRoutes,
		swaggerOptions: options
	}
	/* {
		name: 'Monitoreo',
		description: 'Esquema para monitorear las elecciones',
		path: '/monitoreo',
		router: ,
		swaggerOptions: options
	}, */
	/* {
		name: 'Reportes',
		description: 'Esquema para gestionar los reportes de las elecciones',
		path: '/reportes',
		router: ,
		swaggerOptions: options
	} */
];

/*******************************************************************************************************/
//  //
/*******************************************************************************************************/
export default routes;
