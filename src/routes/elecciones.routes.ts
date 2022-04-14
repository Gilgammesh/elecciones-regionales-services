/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express';
import { validarToken, validarRol } from '../middlewares/authentication';
import * as eleccion from '../controllers/eleccion.controller';

/*******************************************************************************************************/
// Instanciamos router //
/*******************************************************************************************************/
const router: Router = Router();

/*******************************************************************************************************/
// Definimos las rutas //
/*******************************************************************************************************/

// Elecciones
router.get('/', [validarToken, validarRol], eleccion.getAll);
router.post('/', [validarToken, validarRol], eleccion.create);
router.get('/:id', [validarToken, validarRol], eleccion.get);
router.put('/:id', [validarToken, validarRol], eleccion.update);
router.delete('/:id', [validarToken, validarRol], eleccion.remove);

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router;
