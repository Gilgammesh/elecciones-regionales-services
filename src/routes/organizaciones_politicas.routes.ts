/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express'
import { validarToken, validarRol } from '../middlewares/authentication'
import * as organizacion from '../controllers/organizacion_politica/organizacion.controller'
import * as gobernador from '../controllers/organizacion_politica/gobernador.controller'
import * as consejero from '../controllers/organizacion_politica/consejero.controller'
import * as alcalde from '../controllers/organizacion_politica/alcalde.controller'

/*******************************************************************************************************/
// Instanciamos router //
/*******************************************************************************************************/
const router: Router = Router()

/*******************************************************************************************************/
// Definimos las rutas //
/*******************************************************************************************************/

// Organizaciones
router.get('/organizaciones', [validarToken, validarRol], organizacion.getAll)
router.post('/organizaciones', [validarToken, validarRol], organizacion.create)
router.get('/organizaciones/:id', [validarToken, validarRol], organizacion.get)
router.put('/organizaciones/:id', [validarToken, validarRol], organizacion.update)
router.delete('/organizaciones/:id', [validarToken, validarRol], organizacion.remove)

// Gobernadores
router.get('/gobernadores', [validarToken, validarRol], gobernador.getAll)
router.post('/gobernadores', [validarToken, validarRol], gobernador.create)
router.get('/gobernadores/:id', [validarToken, validarRol], gobernador.get)
router.put('/gobernadores/:id', [validarToken, validarRol], gobernador.update)
router.delete('/gobernadores/:id', [validarToken, validarRol], gobernador.remove)

// Consejeros
router.get('/consejeros', [validarToken, validarRol], consejero.getAll)
router.post('/consejeros', [validarToken, validarRol], consejero.create)
router.get('/consejeros/:id', [validarToken, validarRol], consejero.get)
router.put('/consejeros/:id', [validarToken, validarRol], consejero.update)
router.delete('/consejeros/:id', [validarToken, validarRol], consejero.remove)

// Alcaldes
router.get('/alcaldes', [validarToken, validarRol], alcalde.getAll)
router.post('/alcaldes', [validarToken, validarRol], alcalde.create)
router.get('/alcaldes/:id', [validarToken, validarRol], alcalde.get)
router.put('/alcaldes/:id', [validarToken, validarRol], alcalde.update)
router.delete('/alcaldes/:id', [validarToken, validarRol], alcalde.remove)

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router
