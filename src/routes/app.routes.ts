/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express'
import { validarToken } from '../middlewares/app/authentication'
import * as auth from '../controllers/app/auth.controller'
import * as mesa from '../controllers/app/mesa.controller'
import * as gobernador from '../controllers/app/gobernador.controller'
import * as alcalde from '../controllers/app/alcalde.controller'
import * as voto from '../controllers/app/voto.controller'

/*******************************************************************************************************/
// Instanciamos router //
/*******************************************************************************************************/
const router: Router = Router()

/*******************************************************************************************************/
// Definimos las rutas //
/*******************************************************************************************************/

// Autenticaciones
router.post('/auth/check', auth.check)
router.post('/auth/login', auth.login)
router.post('/auth/token', auth.token)

// Mesas
router.get('/mesas', validarToken, mesa.get)

// Organizaciones Políticas
router.get('/organizaciones-politicas/gobernadores', validarToken, gobernador.get)
router.get('/organizaciones-politicas/alcaldes', validarToken, alcalde.get)

// Votaciones
router.post('/votos/gobernadores', validarToken, voto.upsert)
router.post('/votos/alcaldes', validarToken, voto.upsert)
router.get('/votos/gobernadores/:id', validarToken, voto.getRegional)
router.get('/votos/alcaldes/:id', validarToken, voto.getProvincial)
router.put('/votos/gobernadores', validarToken, voto.update)
router.put('/votos/alcaldes', validarToken, voto.update)

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router
