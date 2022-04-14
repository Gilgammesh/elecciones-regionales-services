/*******************************************************************************************************/
// Requerimos las dependencias //
/*******************************************************************************************************/
import { Handler } from 'express';
import { verify, JwtPayload, VerifyErrors } from 'jsonwebtoken';
import Rol, { IRol, IPermisosModulo, IPermisosSubmodulo } from '../models/admin/rol';
import Modulo, { IModulo } from '../models/admin/modulo';
import Usuario, { IUsuario } from '../models/usuario';
import { parseJwtDateExpire } from '../helpers/date';
import { appSecret } from '../configs';

/*******************************************************************************************************/
// Interface de Usuario Response //
/*******************************************************************************************************/
export interface IUsuarioResponse {
	_id: string;
	nombres?: string;
	apellidos?: string;
	dni?: string;
	genero?: string;
	img?: string;
	rol: {
		_id: string;
		super: boolean;
	};
	departamento?: {
		_id: string;
		codigo: string;
		nombre?: string;
	};
}

/*******************************************************************************************************/
// Validamos y decodificamos el jsonwebtoken en la petición  //
/*******************************************************************************************************/
export const validarToken: Handler = async (req, res, next) => {
	// Leemos los headers de la petición
	const { headers } = req;
	// Obtenemos la cabecera de autorización
	const { authorization } = headers;

	// Si no existe el authorization
	if (!authorization || authorization === '') {
		return res.status(401).json({
			status: false,
			msg: 'Se debe proporcionar un token'
		});
	}

	// Obtenemos el token desde la Autorización
	const token: string = <string>authorization;

	try {
		// Intentamos verificar el token, con el texto secreto de la aplicación
		const decoded: JwtPayload = <JwtPayload>verify(token, appSecret);

		// Si existe una decodificación
		if (decoded?.usuario?._id) {
			// Obtenemos los datos del usuario actualizados
			const usuario: IUsuario | null = await Usuario.findById(decoded.usuario._id)
				.populate('rol')
				.populate('departamento');

			// Si existe el usuario
			if (usuario) {
				// Si el usuario está activo
				if (usuario.estado) {
					// Definimos los datos del usuario
					const usuarioResponse: IUsuarioResponse = {
						_id: usuario._id,
						rol: {
							_id: usuario.rol._id,
							super: usuario.rol.super
						},
						...(!usuario.rol.super && {
							departamento: {
								_id: usuario.departamento._id,
								codigo: usuario.departamento.codigo
							}
						})
					};

					// Almacenamos los datos del usuario actualizado en el request
					req.usuario = usuarioResponse;
					// Pasamos a la siguiente función
					next();
				} else {
					// Retornamos
					return res.status(403).json({
						status: false,
						msg: 'El usuario está deshabilitado'
					});
				}
			} else {
				// Retornamos
				return res.status(403).json({
					status: false,
					msg: 'El usuario ya no existe'
				});
			}
		}
	} catch (error: VerifyErrors | any) {
		// Capturamos los tipos de error en la vericación
		if (error.name === 'JsonWebTokenError') {
			// Mostramos el error en consola
			console.log('Autenticando token Middleware', 'JsonWebTokenError', error.message);
			// Retornamos
			return res.status(401).json({
				status: false,
				msg: 'El token proporcionado es inválido'
			});
		}
		if (error.name === 'TokenExpiredError') {
			// Mostramos el error en consola
			console.log('Autenticando token Middleware', 'TokenExpiredError', error.message, error.expiredAt);
			// Obtenemos la fecha de expiración casteada del token
			const msg: string = parseJwtDateExpire(error.expiredAt);
			// Retornamos
			return res.status(401).json({
				status: false,
				msg
			});
		}
		if (error.name === 'NotBeforeError') {
			// Mostramos el error en consola
			console.log('Autenticando token Middleware', 'NotBeforeError', error.message, error.date);
			// Retornamos
			return res.status(401).json({
				status: false,
				msg: 'El token no está activo'
			});
		}
	}
};

/*******************************************************************************************************/
// Verificamos y validamos las rutas que tiene el ROL del usuario  //
/*******************************************************************************************************/
export const validarRol: Handler = async (req, res, next) => {
	// Obtener los datos del usuario
	const { usuario, originalUrl } = req;

	// Obtenemos el Id del Rol del usuario
	const id: string = usuario.rol._id;

	////////////////////////////////////////////////////////////////////////////////////////////////
	// Normalizamos el originalUrl para obtenemos los dos primeros elementos (módulo y submódulo) //
	////////////////////////////////////////////////////////////////////////////////////////////////

	// Removemos el primer caracter ('/')
	const path: string = originalUrl.substring(1);
	// Removemos los query string, haciendo un split a "?"
	const arrayPath: string[] = path.split('?');
	// Cogemos la primera parte del array y separamos por rutas, haciendo split "/"
	const arrayPathNorm: string[] = arrayPath[0].split('/');
	// Número de elementos del array normalizado
	const size = arrayPathNorm.length;

	// Obtenemos el módulo y submódulo de la ruta normalizada
	const modulo: string = size >= 1 ? arrayPathNorm[0] : '';
	const submodulo: string = size >= 2 ? arrayPathNorm[1] : '';

	try {
		// Intentamos buscar los permisos del usuario por el id del rol
		const rol: IRol | null = await Rol.findById(id);

		// Si existe un rol de usuario
		if (rol) {
			// Si el rol de usuario es de Super Administrador
			if (rol.super) {
				// Pasamos a la siguiente función
				next();
			} else {
				// Hacemos un recorrido por los permisos y buscamos una coincidencia con el módulo requerido
				const promisesModulo = rol.permisos
					.filter((eleM: IPermisosModulo) => eleM.modulo === modulo)
					.map((eleM: IPermisosModulo) => eleM);
				const permisoModulo = await Promise.all(promisesModulo);

				// En caso no haya coincidencia con el módulo => no tiene autorización
				if (permisoModulo.length === 0) {
					return res.status(403).json({
						status: false,
						error: 'Usted no cuenta con permisos para esta ruta'
					});
				}

				// BUscamos los datos del módulo por su tag o etiqueta
				const modulo_: IModulo | null = await Modulo.findOne({ tag: modulo });

				// Si el módulo es de tipo collapse, quiere decir que el módulo tiene submódulos
				if (modulo_ && modulo_.type === 'collapse') {
					if (size >= 2) {
						// Hacemos un recorrido por los submódulos del módulo y buscamos una coincidencia con el submódulo requerido
						const promisesSubmodulo = permisoModulo[0].permisos
							.filter((eleSM: IPermisosSubmodulo) => eleSM.submodulo === submodulo)
							.map((eleSM: IPermisosSubmodulo) => eleSM);
						const permisoSubmodulo = await Promise.all(promisesSubmodulo);

						// En caso no haya coincidencia con el submódulo del módulo => no tiene autorización
						if (permisoSubmodulo.length === 0) {
							return res.status(403).json({
								status: false,
								error: 'Usted no cuenta con permisos para esta ruta'
							});
						}
					}
				}

				// Si pasó todas las validaciones seguimos a la siguiente función
				next();
			}
		}
	} catch (error) {
		// Mostramos el error en consola
		console.log('Validando Rol', error);
		// Retornamos
		return res.status(404).json({
			status: false,
			msg: 'No se pudo encontrar el rol'
		});
	}
};
