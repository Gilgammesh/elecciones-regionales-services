/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express'
import { validarToken } from '../middlewares/app/authentication'
import * as auth from '../controllers/app/auth.controller'
import * as mesa from '../controllers/app/mesa.controller'
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

// Actas
router.get('/acta-regional', validarToken, mesa.regional)
router.get('/acta-provincial', validarToken, mesa.provincial)

// Votaciones
router.post('/votos/regionales', validarToken, voto.upsert)
router.post('/votos/provinciales', validarToken, voto.upsert)
router.get('/votos/regionales/:id', validarToken, voto.regional)
router.get('/votos/provinciales/:id', validarToken, voto.provincial)

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router
