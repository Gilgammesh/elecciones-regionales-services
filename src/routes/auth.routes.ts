/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express'
import { validarToken } from '../middlewares/authentication'
import * as auth from '../controllers/auth/auth.controller'
import * as password from '../controllers/auth/password.controller'
import * as token from '../controllers/auth/token.controller'

/*******************************************************************************************************/
// Instanciamos router //
/*******************************************************************************************************/
const router: Router = Router()

/*******************************************************************************************************/
// Definimos las rutas //
/*******************************************************************************************************/

// Autenticaciones
router.post('/check', auth.check)
router.post('/login', auth.login)
router.post('/logout', validarToken, auth.logout)

// Token
router.post('/token', token.generate)

// Clave
router.post('/cambiar-password', validarToken, password.update)

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router
