/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express'
import { validarToken, validarRol } from '../middlewares/authentication'
import * as rol from '../controllers/admin/rol.controller'
import * as modulo from '../controllers/admin/modulo.controller'
import * as accion from '../controllers/admin/accion.controller'
import * as sesion from '../controllers/admin/sesion.controller'
import * as log from '../controllers/admin/log.controller'

/*******************************************************************************************************/
// Instanciamos router //
/*******************************************************************************************************/
const router: Router = Router()

/*******************************************************************************************************/
// Definimos las rutas //
/*******************************************************************************************************/

// Acciones
router.get('/acciones', [validarToken, validarRol], accion.getAll)
router.post('/acciones', [validarToken, validarRol], accion.create)
router.get('/acciones/:id', [validarToken, validarRol], accion.get)
router.put('/acciones/:id', [validarToken, validarRol], accion.update)
router.delete('/acciones/:id', [validarToken, validarRol], accion.remove)

// Módulos
router.get('/modulos', [validarToken, validarRol], modulo.getAll)
router.get('/modulos/:id', [validarToken, validarRol], modulo.get)
router.post('/modulos', [validarToken, validarRol], modulo.create)
router.put('/modulos/:id', [validarToken, validarRol], modulo.update)
router.delete('/modulos/:id', [validarToken, validarRol], modulo.remove)

// Roles
router.get('/roles', [validarToken, validarRol], rol.getAll)
router.get('/roles/:id', [validarToken, validarRol], rol.get)
router.post('/roles', [validarToken, validarRol], rol.create)
router.put('/roles/:id', [validarToken, validarRol], rol.update)
router.delete('/roles/:id', [validarToken, validarRol], rol.remove)

// Sesiones
router.get('/sesiones', [validarToken, validarRol], sesion.getAll)
router.put('/sesiones', validarToken, sesion.update)

// Logs
router.get('/logs', [validarToken, validarRol], log.getAll)
router.get('/logs/:id', [validarToken, validarRol], log.get)

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router
