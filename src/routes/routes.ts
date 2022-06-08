/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express'
import adminRoutes from './admin.routes'
import authRoutes from './auth.routes'
import usuariosRoutes from './usuarios.routes'
import eleccionesRoutes from './elecciones.routes'
import centrosVotacionRoutes from './centros_votacion.routes'
import ubigeoRoutes from './ubigeo.routes'

/*******************************************************************************************************/
// Interface de Rutas //
/*******************************************************************************************************/
interface IRoutes {
  path: string
  router: Router
}

/*******************************************************************************************************/
// Definimos las rutas principales de los Servicios //
/*******************************************************************************************************/
const routes: Array<IRoutes> = [
  {
    path: '/ubigeo',
    router: ubigeoRoutes
  },
  {
    path: '/admin',
    router: adminRoutes
  },
  {
    path: '/auth',
    router: authRoutes
  },
  {
    path: '/elecciones',
    router: eleccionesRoutes
  },
  {
    path: '/usuarios',
    router: usuariosRoutes
  },
  /* {
		path: '/organizaciones-politicas',
		router: ,
	}, */
  {
    path: '/centros-votacion',
    router: centrosVotacionRoutes
  }
  /* {
		path: '/monitoreo',
		router: ,
	}, */
  /* {
		path: '/reportes',
		router: ,
	} */
]

/*******************************************************************************************************/
//  //
/*******************************************************************************************************/
export default routes
