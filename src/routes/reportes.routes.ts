/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express'
import { validarToken, validarRol } from '../middlewares/authentication'
import * as reportes from '../controllers/reportes.controller'

/*******************************************************************************************************/
// Instanciamos router //
/*******************************************************************************************************/
const router: Router = Router()

/*******************************************************************************************************/
// Definimos las rutas //
/*******************************************************************************************************/
router.get('/gobernadores', [validarToken, validarRol], reportes.gobernadores)
router.get('/alcaldes-provinciales', [validarToken, validarRol], reportes.provinciales)
router.get('/alcaldes-distritales', [validarToken, validarRol], reportes.distritales)
router.get('/votos-provincia', [validarToken, validarRol], reportes.votosxProvincia)
router.get('/votos-distrito', [validarToken, validarRol], reportes.votosxDistrito)

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router
