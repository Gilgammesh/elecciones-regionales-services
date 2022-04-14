/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express';
import Log, { ILog } from '../../models/admin/log';
import Usuario, { IUsuario } from '../../models/usuario';
import { parseMomentDate12HDay } from '../../helpers/date';
import { getPage, getPageSize, getTotalPages } from '../../helpers/pagination';

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const exclude_campos = '-super -createdAt -updatedAt';
const pagination = {
	page: 1,
	pageSize: 10
};

/*******************************************************************************************************/
// Obtener todos los logs //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
	// Leemos el usuario y el query de la petición
	const { usuario, query } = req;

	try {
		// Intentamos obtener los ids de los superusuarios
		const usuarios: Array<IUsuario> = await Usuario.find({ super: true }, '_id');
		// Construimos el query de negación
		const promisesUsuarios = usuarios.map(ele => {
			return { usuario: { $ne: ele._id } };
		});
		const queryUsuarios = await Promise.all(promisesUsuarios);

		// Intentamos obtener el total de registros de logs
		let totalRegistros: number;
		// Si es un superusuario
		if (usuario.rol.super) {
			totalRegistros = await Log.countDocuments();
		} else {
			totalRegistros = await Log.find({ $and: queryUsuarios }).count();
		}

		// Obtenemos el número de registros por página y hacemos las validaciones
		const validatePageSize: any = await getPageSize(pagination.pageSize, query.pageSize);
		if (!validatePageSize.status) {
			return res.status(404).json({
				status: validatePageSize.status,
				msg: validatePageSize.msg
			});
		}
		const pageSize = validatePageSize.size;

		// Obtenemos el número total de páginas
		const totalPaginas: number = getTotalPages(totalRegistros, pageSize);

		// Obtenemos el número de página y hacemos las validaciones
		const validatePage: any = await getPage(pagination.page, query.page, totalPaginas);
		if (!validatePage.status) {
			return res.status(404).json({
				status: validatePage.status,
				msg: validatePage.msg
			});
		}
		const page = validatePage.page;

		// Intentamos realizar la búsqueda de todos los logs paginados
		let logs: Array<ILog>;
		// Si es un superusuario
		if (usuario.rol.super) {
			logs = await Log.find()
				.sort({
					createdAt: 'desc',
					id_grupo: 'desc',
					modulo: 'asc',
					submodulo: 'asc',
					evento: 'asc'
				})
				.populate({
					path: 'usuario',
					select: exclude_campos,
					populate: { path: 'rol', select: exclude_campos }
				})
				.skip((page - 1) * pageSize)
				.limit(pageSize);
		} else {
			logs = await Log.find({ $and: queryUsuarios })
				.sort({
					createdAt: 'desc',
					id_grupo: 'desc',
					modulo: 'asc',
					submodulo: 'asc',
					evento: 'asc'
				})
				.populate({
					path: 'usuario',
					select: exclude_campos,
					populate: { path: 'rol', select: exclude_campos }
				})
				.skip((page - 1) * pageSize)
				.limit(pageSize);
		}

		// Construimos la lista de logs con los parámetros que se desea mostrar
		const promises_ = logs.map((ele: ILog) => {
			// Fecha de registro
			const fecha_registro: string = parseMomentDate12HDay(ele.createdAt);

			// Retornamos
			return {
				_id: ele._id,
				usuario: {
					_id: ele.usuario._id,
					nombres: ele.usuario.nombres,
					apellido_paterno: ele.usuario.apellido_paterno,
					apellido_materno: ele.usuario.apellido_materno,
					rol: {
						_id: ele.usuario.rol._id,
						nombre: ele.usuario.rol.nombre
					}
				},
				fuente: ele.fuente,
				origen: ele.origen,
				ip: ele.ip,
				dispositivo: ele.dispositivo,
				navegador: ele.navegador,
				modulo: ele.modulo,
				submodulo: ele.submodulo,
				controller: ele.controller,
				funcion: ele.funcion,
				descripcion: ele.descripcion,
				evento: ele.evento,
				data_in: ele.data_in,
				data_out: ele.data_out,
				procesamiento: ele.procesamiento,
				registros: ele.registros,
				id_grupo: ele.id_grupo,
				fecha_registro
			};
		});
		const list = await Promise.all(promises_);

		// Retornamos la lista de logs
		return res.json({
			status: true,
			pagina: page,
			totalPaginas,
			registros: list.length,
			totalRegistros,
			list
		});
	} catch (error) {
		// Mostramos el error en consola
		console.log('Admin', 'Obteniendo los logs', error);
		// Retornamos
		return res.status(404).json({
			status: false,
			msg: 'No se pudo obtener los logs'
		});
	}
};

/*******************************************************************************************************/
// Obtener datos de un log //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
	// Leemos los parámetros y el query de la petición
	const { params, query } = req;
	// Obtenemos el Id del log
	const { id } = params;

	try {
		// Intentamos realizar la búsqueda por id
		const log: ILog | null = await Log.findById(id).populate({
			path: 'usuario',
			select: exclude_campos,
			populate: { path: 'rol', select: exclude_campos }
		});

		// Si existe un log
		if (log) {
			// Retornamos los datos del log
			return res.json({
				status: true,
				log: {
					_id: log._id,
					usuario: {
						_id: log.usuario._id,
						nombres: log.usuario.nombres,
						apellido_paterno: log.usuario.apellido_paterno,
						apellido_materno: log.usuario.apellido_materno,
						rol: {
							_id: log.usuario.rol._id,
							nombre: log.usuario.rol.nombre
						}
					},
					fuente: log.fuente,
					origen: log.origen,
					ip: log.ip,
					dispositivo: log.dispositivo,
					navegador: log.navegador,
					modulo: log.modulo,
					submodulo: log.submodulo,
					controller: log.controller,
					funcion: log.funcion,
					descripcion: log.descripcion,
					evento: log.evento,
					data_in: log.data_in,
					data_out: log.data_out,
					procesamiento: log.procesamiento,
					registros: log.registros,
					id_grupo: log.id_grupo,
					fecha_registro: parseMomentDate12HDay(log.createdAt)
				}
			});
		} else {
			// Retornamos
			return res.json({
				status: true,
				log: null
			});
		}
	} catch (error) {
		// Mostramos el error en consola
		console.log('Admin', 'Obteniendo log', id, error);
		// Retornamos
		return res.status(404).json({
			status: false,
			msg: 'No se pudo obtener los datos del log'
		});
	}
};

/*******************************************************************************************************/
// Interface de un nuevo del log //
/*******************************************************************************************************/
interface iLog {
	usuario: string;
	fuente: string;
	origen: string;
	ip: string;
	dispositivo: string;
	navegador: string;
	modulo: string;
	submodulo: string;
	controller: string;
	funcion: string;
	descripcion: string;
	evento: string;
	data_in: string;
	data_out: string;
	procesamiento: string;
	registros: number;
	id_grupo: string;
}

/*******************************************************************************************************/
// Función para guardar un nuevo log //
/*******************************************************************************************************/
export const saveLog = async (log: iLog) => {
	// Creamos el modelo de un nuevo log
	const newLog: ILog = new Log(log);

	try {
		// Intentamos guardar el nuevo log
		await newLog.save();
		// Retornamos
		return true;
	} catch (error) {
		// Mostramos el error en consola
		console.log('Admin', 'Crear nuevo log', error);
		// Retornamos
		return false;
	}
};
