/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express';
import { verify, JwtPayload } from 'jsonwebtoken';
import { compare } from 'bcryptjs';
import Usuario, { IUsuario } from '../../models/usuarios/usuario';
import { generateToken, generateTokenWithTime } from '../../helpers/jwtoken';
import { IUsuarioResponse } from '../../middlewares/authentication';

/*******************************************************************************************************/
// Generar token de un usuario //
/*******************************************************************************************************/
export const generate: Handler = async (req, res) => {
	// Leemos el cuerpo de la petición
	const { body } = req;

	try {
		// Intentamos realizar la búsqueda por DNI del usuario
		const usuario: IUsuario | null = await Usuario.findOne({ dni: body.dni }).populate('rol');

		// Verificamos si el usuario existe
		if (!usuario) {
			return res.status(401).json({
				status: false,
				msg: 'El usuario no existe'
			});
		}

		// Verificamos si el usuario está habilitado
		if (usuario.estado === false) {
			return res.status(403).json({
				status: false,
				msg: 'El usuario está desactivado'
			});
		}

		// Verificamos la contraseña del usuario
		const pwdIsValid: boolean = await compare(body.password, usuario.password);
		// Si no es válida
		if (pwdIsValid === false) {
			return res.status(401).json({
				status: false,
				msg: 'La contraseña no es válida'
			});
		}

		// Definimos los datos del usuario enviados en la respuesta
		const usuarioResponse: IUsuarioResponse = {
			_id: usuario._id,
			nombres: usuario.nombres,
			apellidos: usuario.apellidos,
			dni: usuario.dni,
			celular: usuario.celular,
			genero: usuario.genero,
			img: usuario.img,
			rol: {
				_id: usuario.rol._id,
				nombre: usuario.rol.nombre,
				super: usuario.rol.super
			}
		};

		// Definimos el objeto payload
		const payload: JwtPayload = {
			usuario: usuarioResponse
		};

		// Generamos el token del usuario
		let token: string | null;
		// Si el token expira
		if (body.expires) {
			// Generamos un token con el tiempo de expiración
			token = await generateTokenWithTime(payload, body.time);
		}
		// Caso contrario
		else {
			// Generamos un token indefinido que no caduca
			token = await generateToken(payload);
		}

		// Retornamos el token
		return res.json({
			status: true,
			msg: 'Se generó el token correctamente',
			token
		});
	} catch (error) {
		// Mostramos el error en consola
		console.log('Auth', 'Generando token de usuario', error);
		// Retornamos
		return res.status(404).json({
			status: false,
			msg: 'No se pudo generar el token del usuario'
		});
	}
};
