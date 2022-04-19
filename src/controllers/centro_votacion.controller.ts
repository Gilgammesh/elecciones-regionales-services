/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express';
import { Error } from 'mongoose';
import { UploadedFile } from 'express-fileupload';
import xlsxFile from 'read-excel-file/node';
import { Row } from 'read-excel-file/types';
import CentroVotacion, { ICentroVotacion } from '../models/centro_votacion';
import Departamento, { IDepartamento } from '../models/ubigeo/departamento';
import Provincia, { IProvincia } from '../models/ubigeo/provincia';
import Distrito, { IDistrito } from '../models/ubigeo/distrito';
import _ from 'lodash';
import { storeFile } from '../helpers/upload';
import { saveLog } from './admin/log.controller';
import { parseNewDate24H_ } from '../helpers/date';
import { getPage, getPageSize, getTotalPages } from '../helpers/pagination';
import { eventsLogs } from '../models/admin/log';

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo: string = 'centros-votacion';
const nombre_submodulo: string = '';
const nombre_controlador: string = 'centro_votacion.controller';
const exclude_campos = '-createdAt -updatedAt';
const pagination = {
	page: 1,
	pageSize: 10
};

/*******************************************************************************************************/
// Obtener todos los centros de votación //
/*******************************************************************************************************/
export const getAll: Handler = async (req, res) => {
	// Leemos el usuario y el query de la petición
	const { usuario, query } = req;

	try {
		// Definimos el query para los centros de votación
		let queryCentros = {};

		// Añadimos el añó
		queryCentros = { ...queryCentros, anho: usuario.anho };
		// Si es un superusuario
		if (usuario.rol.super) {
			// Filtramos por el query de departamento
			if (query.departamento && query.departamento !== 'todos') {
				queryCentros = { ...queryCentros, ubigeo: { $regex: `^${query.departamento}.*` } };
			}
			// Filtramos por el query de provincia
			if (query.provincia && query.provincia !== 'todos') {
				queryCentros = { ...queryCentros, ubigeo: { $regex: `^${query.departamento}${query.provincia}.*` } };
			}
			// Filtramos por el query de distrito
			if (query.distrito && query.distrito !== 'todos') {
				queryCentros = {
					...queryCentros,
					ubigeo: { $regex: `^${query.departamento}${query.provincia}${query.distrito}.*` }
				};
			}
		} else {
			// Filtramos por los que no son superusuarios
			queryCentros = { ...queryCentros, ubigeo: { $regex: `^${usuario.departamento?.codigo}.*` } };
			// Filtramos por el query de provincia
			if (query.provincia && query.provincia !== 'todos') {
				queryCentros = {
					...queryCentros,
					ubigeo: { $regex: `^${usuario.departamento?.codigo}${query.provincia}.*` }
				};
			}
			// Filtramos por el query de distrito
			if (query.distrito && query.distrito !== 'todos') {
				queryCentros = {
					...queryCentros,
					ubigeo: { $regex: `^${usuario.departamento?.codigo}${query.provincia}${query.distrito}.*` }
				};
			}
		}

		// Intentamos obtener el total de registros de centros de votación
		const totalRegistros: number = await CentroVotacion.find(queryCentros).count();

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

		// Intentamos realizar la búsqueda de todos los centros de votación paginados
		const list: Array<ICentroVotacion> = await CentroVotacion.find(queryCentros, exclude_campos)
			.sort({ ubigeo: 'asc', mesa: 'asc' })
			.populate('departamento', exclude_campos)
			.populate('provincia', exclude_campos)
			.populate('distrito', exclude_campos)
			.populate('personero_local', exclude_campos)
			.populate('personero_mesa', exclude_campos)
			.collation({ locale: 'es', numericOrdering: true })
			.skip((page - 1) * pageSize)
			.limit(pageSize);

		// Retornamos la lista de centros de votación
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
		console.log('Centros de Votación', 'Obteniendo la lista de centros de votación', error);
		// Retornamos
		return res.status(404).json({
			status: false,
			msg: 'No se pudo obtener los centros de votación'
		});
	}
};

/*******************************************************************************************************/
// Obtener datos de un centro de votación //
/*******************************************************************************************************/
export const get: Handler = async (req, res) => {
	// Leemos los parámetros de la petición
	const { params } = req;
	// Obtenemos el Id del centro de votación
	const { id } = params;

	try {
		// Intentamos realizar la búsqueda por id
		const centro_votacion: ICentroVotacion | null = await CentroVotacion.findById(id, exclude_campos)
			.populate('departamento', exclude_campos)
			.populate('provincia', exclude_campos)
			.populate('distrito', exclude_campos)
			.populate('personero_local', exclude_campos)
			.populate('personero_mesa', exclude_campos);

		// Retornamos los datos del centro de votación encontrado
		return res.json({
			status: true,
			centro_votacion
		});
	} catch (error) {
		// Mostramos el error en consola
		console.log('Centros de Votación', 'Obteniendo datos de centro de votación', id, error);
		// Retornamos
		return res.status(404).json({
			status: false,
			msg: 'No se pudo obtener los datos del centro de votación'
		});
	}
};

/*******************************************************************************************************/
// Crear un nuevo centro de votación //
/*******************************************************************************************************/
export const create: Handler = async (req, res) => {
	// Leemos las cabeceras, el usuario, el cuerpo y los archivos de la petición
	const { headers, usuario, body } = req;

	// Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
	const { source, origin, ip, device, browser } = headers;

	try {
		// Si no es un superusuario
		if (!usuario.rol.super) {
			body.departamento = usuario.departamento?._id;
		}

		// Obtenemos los datos del distrito si existe
		const distrito: IDistrito | null = await Distrito.findById(body.distrito);

		// Definimos el ubigeo
		body.ubigeo = distrito?.ubigeo;

		// Pasamos el año
		body.anho = usuario.anho;

		// Creamos el modelo de un nuevo centro de votacion
		const newCentroVotacion: ICentroVotacion = new CentroVotacion(body);

		// Intentamos guardar el nuevo centro de votación
		const centroVotacionOut: ICentroVotacion = await newCentroVotacion.save();

		// Guardamos el log del evento
		await saveLog({
			usuario: usuario._id,
			fuente: <string>source,
			origen: <string>origin,
			ip: <string>ip,
			dispositivo: <string>device,
			navegador: <string>browser,
			modulo: nombre_modulo,
			submodulo: nombre_submodulo,
			controller: nombre_controlador,
			funcion: 'create',
			descripcion: 'Crear nuevo centro de votación',
			evento: eventsLogs.create,
			data_in: '',
			data_out: JSON.stringify(centroVotacionOut, null, 2),
			procesamiento: 'unico',
			registros: 1,
			id_grupo: `${usuario._id}@${parseNewDate24H_()}`
		});

		// Obtenemos el centro de votación creado
		const centroVotacionResp: ICentroVotacion | null = await CentroVotacion.findById(
			centroVotacionOut._id,
			exclude_campos
		);

		// Si existe un socket
		if (globalThis.socketIO) {
			// Emitimos el evento => centro de votación creado en el módulo centros de votación, a todos los usuarios conectados //
			globalThis.socketIO.broadcast.emit('centro-votacion-creado');
		}

		// Retornamos el centro de votación creado
		return res.json({
			status: true,
			msg: 'Se creó el centro de votación correctamente',
			centro_votacion: centroVotacionResp
		});
	} catch (error: Error | any) {
		// Mostramos el error en consola
		console.log('Centros de Votación', 'Crear nuevo centro de votación', error);

		// Inicializamos el mensaje de error
		let msg: string = 'No se pudo crear el centro de votación';
		// Si existe un error con validación de campo único
		if (error?.errors) {
			// Obtenemos el array de errores
			const array: string[] = Object.keys(error.errors);
			// Construimos el mensaje de error de acuerdo al campo
			msg = `${error.errors[array[0]].path}: ${error.errors[array[0]].properties.message}`;
		}

		// Retornamos
		return res.status(404).json({
			status: false,
			msg
		});
	}
};

/*******************************************************************************************************/
// Actualizar los datos de un centro de votación //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
	// Leemos las cabeceras, el usuario, los parámetros, query, el cuerpo y los archivos de la petición
	const { headers, usuario, params, query, body } = req;
	// Obtenemos el Id del centro de votación
	const { id } = params;

	// Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
	const { source, origin, ip, device, browser } = headers;

	try {
		// Intentamos obtener el centro de votación antes que se actualice
		const centroVotacionIn: ICentroVotacion | null = await CentroVotacion.findById(id);

		// Intentamos realizar la búsqueda por id y actualizamos
		const centroVotacionOut: ICentroVotacion | null = await CentroVotacion.findByIdAndUpdate(id, body, {
			new: true,
			runValidators: true,
			context: 'query'
		});

		// Guardamos el log del evento
		await saveLog({
			usuario: usuario._id,
			fuente: <string>source,
			origen: <string>origin,
			ip: <string>ip,
			dispositivo: <string>device,
			navegador: <string>browser,
			modulo: nombre_modulo,
			submodulo: nombre_submodulo,
			controller: nombre_controlador,
			funcion: 'update',
			descripcion: 'Actualizar un centro de votación',
			evento: eventsLogs.update,
			data_in: JSON.stringify(centroVotacionIn, null, 2),
			data_out: JSON.stringify(centroVotacionOut, null, 2),
			procesamiento: 'unico',
			registros: 1,
			id_grupo: `${usuario._id}@${parseNewDate24H_()}`
		});

		// Obtenemos el centro de votación actualizado
		const centroVotacionResp: ICentroVotacion | null = await CentroVotacion.findById(id, exclude_campos);

		// Si existe un socket
		if (globalThis.socketIO) {
			// Emitimos el evento => centro de votación actualizado en el módulo centros de votación, a todos los usuarios conectados //
			globalThis.socketIO.broadcast.emit('centro-votacion-actualizado');
		}

		// Retornamos el centro de votación actualizado
		return res.json({
			status: true,
			msg: 'Se actualizó el centro de votación correctamente',
			centro_votacion: centroVotacionResp
		});
	} catch (error: Error | any) {
		// Mostramos el error en consola
		console.log('Centros de Votación', 'Actualizando centro de votación', id, error);

		// Inicializamos el mensaje de error
		let msg: string = 'No se pudo actualizar los datos del centro de votación';
		// Si existe un error con validación de campo único
		if (error?.errors) {
			// Obtenemos el array de errores
			const array: string[] = Object.keys(error.errors);
			// Construimos el mensaje de error de acuerdo al campo
			msg = `${error.errors[array[0]].path}: ${error.errors[array[0]].properties.message}`;
		}

		// Retornamos
		return res.status(404).json({
			status: false,
			msg
		});
	}
};

/*******************************************************************************************************/
// Eliminar un centro de votación //
/*******************************************************************************************************/
export const remove: Handler = async (req, res) => {
	// Leemos las cabeceras, el usuario, los parámetros y el query de la petición
	const { headers, usuario, params, query } = req;
	// Obtenemos el Id del centro de votación
	const { id } = params;

	// Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
	const { source, origin, ip, device, browser } = headers;

	try {
		// Obtenemos el centro de votación antes que se elimine
		const centroVotacionResp: ICentroVotacion | null = await CentroVotacion.findById(id, exclude_campos);

		// Intentamos realizar la búsqueda por id y removemos
		const centroVotacionIn: ICentroVotacion | null = await CentroVotacion.findByIdAndRemove(id);

		// Guardamos el log del evento
		await saveLog({
			usuario: usuario._id,
			fuente: <string>source,
			origen: <string>origin,
			ip: <string>ip,
			dispositivo: <string>device,
			navegador: <string>browser,
			modulo: nombre_modulo,
			submodulo: nombre_submodulo,
			controller: nombre_controlador,
			funcion: 'remove',
			descripcion: 'Remover un centro de votación',
			evento: eventsLogs.remove,
			data_in: JSON.stringify(centroVotacionIn, null, 2),
			data_out: '',
			procesamiento: 'unico',
			registros: 1,
			id_grupo: `${usuario._id}@${parseNewDate24H_()}`
		});

		// Si existe un socket
		if (globalThis.socketIO) {
			// Emitimos el evento => centro de votación eliminado en el módulo centros de votación, a todos los usuarios conectados //
			globalThis.socketIO.broadcast.emit('centro-votacion-eliminado');
		}

		// Retornamos el centro de votación eliminado
		return res.json({
			status: true,
			msg: 'Se eliminó el centro de votación correctamente',
			centro_votacion: centroVotacionResp
		});
	} catch (error) {
		// Mostramos el error en consola
		console.log('Centros de Votación', 'Eliminando centro de votación', id, error);
		// Retornamos
		return res.status(404).json({
			status: false,
			msg: 'No se pudo eliminar el centro de votación'
		});
	}
};

/*******************************************************************************************************/
// Interface mensajes de errores //
/*******************************************************************************************************/
interface IMsgError {
	index: number;
	msg: string;
}

/*******************************************************************************************************/
// Procesar archivo excel de centros de votación //
/*******************************************************************************************************/
export const importExcel: Handler = async (req, res) => {
	// Leemos las cabeceras, el usuario y los archivos de la petición
	const { headers, usuario, files } = req;

	// Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
	const { source, origin, ip, device, browser } = headers;

	// Si existe un archivo de excel se crea la ruta y se almacena
	if (files && Object.keys(files).length > 0 && files.file) {
		try {
			// Guardamos el archivo localmente para recorrerlo y obtenemos la ruta
			const pathFile: string = await storeFile(<UploadedFile>files.file, 'centros-votacion', 'temp');

			// Obtenemos las filas de la plantilla de excel
			const rows: Row[] = await xlsxFile(pathFile, { sheet: 1 });

			// Inicializamos el array de mensjaes de errores
			let msgError: IMsgError[] = [];

			// Establecemos la fila de inicio
			const rowStart: number = 1;

			// Establecemos el id de grupo de log
			let id_grupo: string = `${usuario._id}@${parseNewDate24H_()}`;

			// Recorremos las filas y guardamos cada fila previamente validada
			const promises = rows.map(async (row, index) => {
				// Si el el index es mayor o igual al fila de inicio
				if (index >= rowStart) {
					const msg = await validateFields(
						row,
						index,
						usuario.departamento ? usuario.departamento?.codigo : '',
						usuario.rol.super
					);
					// Si pasó las pruebas de valicación, guardamos los datos del centro de votación
					if (msg === 'ok') {
						// Obtenemos los datos del departamento si existe
						const departamento: IDepartamento | null = await Departamento.findOne({
							codigo: `${row[0]}`.substring(0, 2)
						});
						// Obtenemos los datos de la provincia si existe
						const provincia: IProvincia | null = await Provincia.findOne({
							codigo: `${row[0]}`.substring(2, 4),
							departamento: `${row[0]}`.substring(0, 2)
						});
						// Obtenemos los datos del distrito si existe
						const distrito: IDistrito | null = await Distrito.findOne({
							codigo: `${row[0]}`.substring(4, 6),
							provincia: `${row[0]}`.substring(2, 4),
							departamento: `${row[0]}`.substring(0, 2)
						});

						// Creamos el modelo de un nuevo centro de votacion
						const newCentroVotacion: ICentroVotacion = new CentroVotacion({
							ubigeo: `${row[0]}`,
							departamento: departamento?._id,
							provincia: provincia?._id,
							distrito: distrito?._id,
							nombre: `${row[4]}`.trim(),
							mesa: `${row[5]}`,
							...(row[6] && { votantes: parseInt(`${row[6]}`, 10) }),
							anho: usuario.anho
						});

						// Intentamos guardar el nuevo centro de votación
						const centroVotacionOut: ICentroVotacion = await newCentroVotacion.save();

						// Guardamos el log del evento
						await saveLog({
							usuario: usuario._id,
							fuente: <string>source,
							origen: <string>origin,
							ip: <string>ip,
							dispositivo: <string>device,
							navegador: <string>browser,
							modulo: nombre_modulo,
							submodulo: nombre_submodulo,
							controller: nombre_controlador,
							funcion: 'create',
							descripcion: 'Crear nuevo centro de votación por excel importado',
							evento: eventsLogs.create,
							data_in: '',
							data_out: JSON.stringify(centroVotacionOut, null, 2),
							procesamiento: 'masivo',
							registros: 1,
							id_grupo
						});
					} else {
						// Guardamos el mensaje de error en el array de mensajes
						msgError.push({ index, msg });
					}
				}
				return null;
			});
			await Promise.all(promises);

			// Si existe un socket
			if (globalThis.socketIO) {
				// Emitimos el evento => centros de votación importados en el módulo centros de votación, a todos los usuarios conectados //
				globalThis.socketIO.broadcast.emit('centros-votacion-importados');
			}

			// Retornamos el detalle de los mensajes de error si existen
			return res.json({
				status: true,
				errores: _.orderBy(msgError, ['index'], ['asc'])
			});
		} catch (error) {
			// Mostramos el error en consola
			console.log('Centros de Votación', 'Importando Excel', error);
			// Retornamos
			return res.status(404).json({
				status: false,
				msg: 'No se pudo subir el archivo excel. Consulte con el administrador del Sistema!!'
			});
		}
	}
};

/*******************************************************************************************************/
// Función para validar los campos del excel de centros de votación //
/*******************************************************************************************************/
const validateFields = async (row: Row, index: number, codigo: string, superUser: boolean) => {
	// Validamos que el ubigeo no esté vacio
	if (`${row[0]}` === '' || row[0] === null) {
		return `Fila ${index}: El campo ubigeo no puede estar vacio`;
	}
	// Validamos que el nombre del centro de votación no esté vacio
	if (`${row[4]}` === '' || row[4] === null) {
		return `Fila ${index}: El campo nombre centro votación no puede estar vacio`;
	}
	// Validamos que el número de mesa no esté vacio
	if (`${row[5]}` === '' || row[5] === null) {
		return `Fila ${index}: El campo número mesa no puede estar vacio`;
	}
	// Validamos que el ubigeo tenga 6 dígitos
	if (`${row[0]}`.length !== 6) {
		return `Fila ${index}: El campo ubigeo debe tener 6 dígitos`;
	}
	// Validamos que el ubigeo corresponda al departamento del usuario
	if (!superUser && `${row[0]}`.substring(0, 2) !== codigo) {
		return `Fila ${index}: El campo ubigeo debe comenzar con el código de departamento ${codigo}`;
	}
	// Validamos que el número de mesa tenga 6 dígitos
	if (`${row[5]}`.length !== 6) {
		return `Fila ${index}: El campo número de mesa debe tener 6 dígitos`;
	}
	// Obtenemos los datos del departamento si existe
	const departamento: IDepartamento | null = await Departamento.findOne({ codigo: `${row[0]}`.substring(0, 2) });
	// Validamos que exista el departamento
	if (!departamento) {
		return `Fila ${index}: El departamento ${`${row[0]}`.substring(0, 2)} no existe`;
	}
	// Obtenemos los datos de la provincia si existe
	const provincia: IProvincia | null = await Provincia.findOne({
		codigo: `${row[0]}`.substring(2, 4),
		departamento: `${row[0]}`.substring(0, 2)
	});
	// Validamos que exista la provincia
	if (!provincia) {
		return `Fila ${index}: La provincia ${`${row[0]}`.substring(2, 4)} no existe`;
	}
	// Obtenemos los datos del distrito si existe
	const distrito: IDistrito | null = await Distrito.findOne({
		codigo: `${row[0]}`.substring(4, 6),
		provincia: `${row[0]}`.substring(2, 4),
		departamento: `${row[0]}`.substring(0, 2)
	});
	// Validamos que exista el distrito
	if (!distrito) {
		return `Fila ${index}: El distrito ${`${row[0]}`.substring(4, 6)} no existe`;
	}
	/* // Obtenemos los datos del número de mesa si existe
	const centro_votacion: ICentroVotacion | null = await CentroVotacion.findOne({ mesa: `${row[5]}` });
	// Si existen un centro de votación con el número de mesa
	if (centro_votacion) {
		return `Fila ${index}: El número de mesa ${row[5]}, se encuentra registrado`;
	} */
	// Si pasó todas las validaciones
	return 'ok';
};
