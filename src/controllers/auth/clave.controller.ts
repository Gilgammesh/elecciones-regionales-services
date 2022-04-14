/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express';
import Usuario, { IUsuario } from '../../models/usuario';
import { compare } from 'bcryptjs';
import encrypt from '../../helpers/encrypt';
import { saveLog } from '../admin/log.controller';
import { parseNewDate24H_ } from '../../helpers/date';
import { eventsLogs } from '../../models/admin/log';

/*******************************************************************************************************/
// Variables generales del Controlador //
/*******************************************************************************************************/
const nombre_modulo: string = 'auth';
const nombre_submodulo: string = 'clave';
const nombre_controlador: string = 'clave.controller';

/*******************************************************************************************************/
// Actualizar la clave de un usuario desde la intranet //
/*******************************************************************************************************/
export const update: Handler = async (req, res) => {
	// Leemos las cabeceras, el usuario , los parámetros y el cuerpo de la petición
	const { headers, usuario, body } = req;

	// Obtenemos la Fuente, Origen, Ip, Dispositivo y Navegador del usuario
	const { source, origin, ip, device, browser } = headers;

	try {
		// Intentamos obtener el usuario antes que se actualice
		const usuarioIn: IUsuario | null = await Usuario.findById(usuario._id);

		// Si existe un usuario
		if (usuarioIn) {
			// Comparamos la contraseña actual del usuario con la proporcionada en el formulario
			const pwdIsValid: boolean = await compare(body.password, usuarioIn.password);
			// Si la contraseña no es válida
			if (pwdIsValid === false) {
				return res.status(401).json({
					status: false,
					msg: 'La contraseña actual no es válida'
				});
			}
			// Si la contraseña es válida
			else {
				// Encriptamos la contraseña nueva antes de guardarla
				const newPwdEncrypted: string | null = await encrypt(body.newPassword);

				// Si existe un password encriptado
				if (newPwdEncrypted) {
					// Intentamos realizar la búsqueda por id y actualizamos
					const usuarioOut: IUsuario | null = await Usuario.findByIdAndUpdate(
						usuario._id,
						{ password: newPwdEncrypted },
						{
							new: true,
							runValidators: true,
							context: 'query'
						}
					);

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
						descripcion: 'Actualizar clave de usuario desde la intranet',
						evento: eventsLogs.update,
						data_in: JSON.stringify(usuarioIn, null, 2),
						data_out: JSON.stringify(usuarioOut, null, 2),
						procesamiento: 'unico',
						registros: 1,
						id_grupo: `${usuario._id}@${parseNewDate24H_()}`
					});

					// Retornamos la confirmación de la actualización
					return res.json({
						status: true,
						msg: 'Se actualizó la clave del usuario correctamente'
					});
				}
			}
		}
		// Caso que no exista usuario
		else {
			// Retornamos
			return res.status(404).json({
				status: false,
				msg: 'El usuario no existe'
			});
		}
	} catch (error) {
		// Mostramos el error en consola
		console.log('Auth', 'Actualizando clave de usuario', usuario._id, error);
		// Retornamos
		return res.status(404).json({
			status: false,
			msg: 'No se pudo actualizar la clave del usuario'
		});
	}
};
