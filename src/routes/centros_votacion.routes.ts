/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express'
import { validarToken, validarRol } from '../middlewares/authentication'
import * as mesa from '../controllers/centro_votacion/mesa.controller'
import * as personero from '../controllers/centro_votacion/personero.controller'

/*******************************************************************************************************/
// Instanciamos router //
/*******************************************************************************************************/
const router: Router = Router()

/*******************************************************************************************************/
// Definimos las rutas //
/*******************************************************************************************************/

// Personeros
router.get('/personeros', [validarToken, validarRol], personero.getAll)
router.post('/personeros', [validarToken, validarRol], personero.create)
router.get('/personeros/:id', [validarToken, validarRol], personero.get)
router.put('/personeros/:id', [validarToken, validarRol], personero.update)
router.delete('/personeros/:id', [validarToken, validarRol], personero.remove)
router.post(
  '/personeros/import-excel',
  [validarToken, validarRol],
  personero.importExcel
)

// Mesas de votación
router.get('/mesas', [validarToken, validarRol], mesa.getAll)
router.post('/mesas', [validarToken, validarRol], mesa.create)
router.get('/mesas/:id', [validarToken, validarRol], mesa.get)
router.put('/mesas/:id', [validarToken, validarRol], mesa.update)
router.delete('/mesas/:id', [validarToken, validarRol], mesa.remove)
router.post('/mesas/import-excel', [validarToken, validarRol], mesa.importExcel)

// Mesas y Locales resumidos
router.get('/getMesas', [validarToken], mesa.getMesas)
router.get('/getLocales', [validarToken], mesa.getLocales)

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router
