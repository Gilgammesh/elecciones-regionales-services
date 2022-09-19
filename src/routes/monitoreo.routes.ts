/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express'
import { validarToken, validarRol } from '../middlewares/authentication'
import * as monitoreo from '../controllers/monitoreo.controller'
import * as voto from '../controllers/voto.controller'

/*******************************************************************************************************/
// Instanciamos router //
/*******************************************************************************************************/
const router: Router = Router()

/*******************************************************************************************************/
// Definimos las rutas //
/*******************************************************************************************************/
// Mesas de votación
router.get('/mesas', [validarToken, validarRol], monitoreo.get)
router.put('/mesa/:id/reopen', [validarToken, validarRol], monitoreo.reopen)

// Actas
router.get('/acta-regional', [validarToken, validarRol], monitoreo.regional)
router.get('/acta-provincial', [validarToken, validarRol], monitoreo.provincial)

// Votos
router.post('/votos/regionales', [validarToken, validarRol], voto.upsert)
router.post('/votos/provinciales', [validarToken, validarRol], voto.upsert)
router.get('/votos/regionales/:id', [validarToken, validarRol], voto.regional)
router.get('/votos/provinciales/:id', [validarToken, validarRol], voto.provincial)

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router
