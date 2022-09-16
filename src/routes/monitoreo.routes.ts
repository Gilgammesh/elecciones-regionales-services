/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express'
import { validarToken, validarRol } from '../middlewares/authentication'
import * as monitoreo from '../controllers/monitoreo.controller'

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
router.get('/acta-regional', [validarToken, validarRol], monitoreo.gobernadores)
router.get('/acta-provincial', [validarToken, validarRol], monitoreo.alcaldes)

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router
