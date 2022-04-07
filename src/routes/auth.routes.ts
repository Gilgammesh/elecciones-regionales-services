/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express';
import { validarToken } from '../middlewares/authentication';
import * as auth from '../controllers/auth/auth.controller';
import * as clave from '../controllers/auth/clave.controller';
import * as token from '../controllers/auth/token.controller';

/*******************************************************************************************************/
// Instanciamos router //
/*******************************************************************************************************/
const router: Router = Router();

/*******************************************************************************************************/
// Definimos las rutas //
/*******************************************************************************************************/

// Autenticaciones
router.post('/check', auth.check);
router.post('/login', auth.login);
router.post('/logout', validarToken, auth.logout);

// Token
router.post('/token', token.generate);

// Clave
router.put('/cambiar-clave', validarToken, clave.update);

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router;