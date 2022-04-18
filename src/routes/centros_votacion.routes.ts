/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express';
import { validarToken, validarRol } from '../middlewares/authentication';
import * as centro_votacion from '../controllers/centro_votacion.controller';

/*******************************************************************************************************/
// Instanciamos router //
/*******************************************************************************************************/
const router: Router = Router();

/*******************************************************************************************************/
// Definimos las rutas //
/*******************************************************************************************************/

// Centros de votación
router.post('/import-excel', [validarToken, validarRol], centro_votacion.importExcel);
router.get('/', [validarToken, validarRol], centro_votacion.getAll);
router.post('/', [validarToken, validarRol], centro_votacion.create);
router.get('/:id', [validarToken, validarRol], centro_votacion.get);
router.put('/:id', [validarToken, validarRol], centro_votacion.update);
router.delete('/:id', [validarToken, validarRol], centro_votacion.remove);

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router;
