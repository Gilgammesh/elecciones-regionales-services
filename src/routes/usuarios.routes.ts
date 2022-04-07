/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express';
import { validarToken, validarRol } from '../middlewares/authentication';
import * as usuario from '../controllers/usuarios/usuario.controller';

/*******************************************************************************************************/
// Instanciamos router //
/*******************************************************************************************************/
const router: Router = Router();

/*******************************************************************************************************/
// Definimos las rutas //
/*******************************************************************************************************/
router.get('/', [validarToken, validarRol], usuario.getAll);
router.post('/', [validarToken, validarRol], usuario.create);
router.get('/:id', [validarToken, validarRol], usuario.get);
router.put('/:id', [validarToken, validarRol], usuario.update);
router.delete('/:id', [validarToken, validarRol], usuario.remove);

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router;
