/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express'
import { validarToken } from '../middlewares/app/authentication'
import * as auth from '../controllers/app/auth.controller'
import * as personero from '../controllers/app/personero.controller'

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

// Personero
router.get('/personero/mesas', validarToken, personero.getMesas)

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router
