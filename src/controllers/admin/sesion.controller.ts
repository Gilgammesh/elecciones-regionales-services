/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express'
import Sesion, { ISesion } from '../../models/admin/sesion'
import Usuario, { IUsuario } from '../../models/usuario'
import { parseMomentDate12HDay } from '../../helpers/date'
import { getPage, getPageSize, getTotalPages } from '../../helpers/pagination'

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const exclude_campos = '-super -createdAt -updatedAt'
const pagination = {
  page: 1,
  pageSize: 10
}

/*******************************************************************************************************/
// Obtener todas las sesiones //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
  // Leemos el usuario y el query de la petición
  const { usuario, query } = req

  try {
    // Intentamos obtener los ids de los superusuarios
    const usuarios: Array<IUsuario> = await Usuario.find({ super: true }, '_id')
    // Construimos el query de negación
    const promisesUsuarios = usuarios.map(ele => {
      return { usuario: { $ne: ele._id } }
    })
    const queryUsuarios = await Promise.all(promisesUsuarios)

    // Intentamos obtener el total de registros de sesiones
    let totalRegistros: number
    // Si es un superusuario
    if (usuario.rol.super) {
      totalRegistros = await Sesion.countDocuments({ fuente: query.fuente as string })
    } else {
      totalRegistros = await Sesion.find({
        $and: queryUsuarios,
        fuente: query.fuente as string
      }).count()
    }

    // Obtenemos el número de registros por página y hacemos las validaciones
    const validatePageSize = await getPageSize(pagination.pageSize, query.pageSize as string)
    if (!validatePageSize.status) {
      return res.status(404).json({
        status: validatePageSize.status,
        msg: validatePageSize.msg
      })
    }
    const pageSize = validatePageSize.size as number

    // Obtenemos el número total de páginas
    const totalPaginas: number = getTotalPages(totalRegistros, pageSize)

    // Obtenemos el número de página y hacemos las validaciones
    const validatePage = await getPage(pagination.page, query.page as string, totalPaginas)
    if (!validatePage.status) {
      return res.status(404).json({
        status: validatePage.status,
        msg: validatePage.msg
      })
    }
    const page = validatePage.page as number

    // Intentamos realizar la búsqueda de todas los sesiones paginados
    let sesiones: Array<ISesion>
    // Si es un superusuario
    if (usuario.rol.super) {
      sesiones = await Sesion.find({ fuente: query.fuente as string })
        .sort({ updatedAt: 'desc' })
        .populate({
          path: 'usuario',
          select: exclude_campos,
          populate: { path: 'rol', select: exclude_campos }
        })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
    } else {
      sesiones = await Sesion.find({ $and: queryUsuarios, fuente: query.fuente as string })
        .sort({ updatedAt: 'desc' })
        .populate({
          path: 'usuario',
          select: exclude_campos,
          populate: { path: 'rol', select: exclude_campos }
        })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
    }

    // Construimos la lista de sesiones con los parámetros que se desea mostrar
    const promises_ = sesiones.map(async (ele: ISesion) => {
      // Fecha del último ingreso
      const ultimo_ingreso: string = parseMomentDate12HDay(ele.updatedAt)
      // Fecha de creación del usuario
      const primer_ingreso: string = parseMomentDate12HDay(ele.createdAt)

      // Retornamos
      return {
        _id: ele._id,
        usuario: {
          _id: ele.usuario._id,
          nombres: ele.usuario.nombres,
          apellidos: ele.usuario.apellidos,
          dni: ele.usuario.dni,
          rol: {
            _id: ele.usuario.rol._id,
            nombre: ele.usuario.rol.nombre
          }
        },
        fuente: ele.fuente,
        ip: ele.ip,
        dispositivo: ele.dispositivo,
        navegador: ele.navegador,
        ultimo_ingreso,
        primer_ingreso,
        estado: ele.estado
      }
    })
    const list = await Promise.all(promises_)

    // Retornamos la lista de sesiones
    return res.json({
      status: true,
      pagina: page,
      totalPaginas,
      registros: list.length,
      totalRegistros,
      list
    })
  } catch (error) {
    // Mostramos el error en consola
    console.log('Admin', 'Obteniendo las sesiones', error)
    // Retornamos
    return res.status(404).json({
      status: false,
      msg: 'No se pudo obtener las sesiones'
    })
  }
}
