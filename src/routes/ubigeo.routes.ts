/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Router } from 'express'
import { validarToken, validarRol } from '../middlewares/authentication'
import * as departamento from '../controllers/ubigeo/departamento.controller'
import * as provincia from '../controllers/ubigeo/provincia.controller'
import * as distrito from '../controllers/ubigeo/distrito.controller'

/*******************************************************************************************************/
// Instanciamos router //
/*******************************************************************************************************/
const router: Router = Router()

/*******************************************************************************************************/
// Definimos las rutas //
/*******************************************************************************************************/

// Departamentos
router.get('/departamentos', validarToken, departamento.getAll)
router.post('/departamentos', validarToken, departamento.create)
router.get('/departamentos/:id', validarToken, departamento.get)
router.put('/departamentos/:id', validarToken, departamento.update)
router.delete('/departamentos/:id', validarToken, departamento.remove)

// Provincias
router.get('/provincias', validarToken, provincia.getAll)
router.get('/provincias_', validarToken, provincia.getAll_)
router.get('/provincias/:id', validarToken, provincia.get)
router.post('/provincias', validarToken, provincia.create)
router.put('/provincias/:id', validarToken, provincia.update)
router.delete('/provincias/:id', validarToken, provincia.remove)

// Distritos
router.get('/distritos', validarToken, distrito.getAll)
router.get('/distritos_', validarToken, distrito.getAll_)
router.get('/distritos/:id', validarToken, distrito.get)
router.post('/distritos', validarToken, distrito.create)
router.put('/distritos/:id', validarToken, distrito.update)
router.delete('/distritos/:id', validarToken, distrito.remove)

/*******************************************************************************************************/
// Exportamos las rutas definidas en router por defecto //
/*******************************************************************************************************/
export default router
