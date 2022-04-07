/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { SwaggerOptions } from 'swagger-ui-express';
import { appNombre, appDescripcion, appEnvironment, appAutorEmail, appAutorName, appAutorWeb } from '../configs';
import { getHost } from '../helpers/host';

/*******************************************************************************************************/
// Variables de las opciones //
/*******************************************************************************************************/
const basePath: string = '/usuario';
const schema: string = 'Usuario';

/*******************************************************************************************************/
// Opciones de SWAGGER //
/*******************************************************************************************************/
export const options: SwaggerOptions = {
	openapi: '3.0.0',
	info: {
		title: `${schema} - ${appNombre}`,
		description: `${appDescripcion} - Esquema ${schema}`,
		version: '1.0.0',
		contact: {
			name: appAutorName,
			email: appAutorEmail,
			url: appAutorWeb
		}
	},
	servers: [
		{
			url: `${getHost()}${basePath}`,
			description: appEnvironment === 'development' ? 'Servidor Local' : 'Servidor Producción'
		}
	],
	tags: [
		{
			name: 'Token',
			description: 'Rutas relacionadas al token de los usuarios de la intranet'
		},
		{
			name: 'Clave',
			description: 'Rutas relacionadas a la clave de los usuarios de la intranet'
		}
	],
	paths: {
		'/token': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			post: {
				tags: ['Token'],
				summary: 'Generar token de usuario',
				description: 'Método para genera el token de un usuario de la intranet',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/TokenRequest'
							},
							examples: {
								usuario: {
									summary: 'Un ejemplo de datos del token',
									value: {
										dni: '12345678',
										password: 'secret',
										expires: true,
										time: '1d'
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Token de usuario',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: { type: 'boolean' },
										msg: { type: 'string' },
										token: { type: 'string' }
									},
									example: {
										status: true,
										msg: 'Se generó el token correctamente',
										token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
									}
								}
							}
						}
					},
					'401': {
						description: 'No autorizado',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/Error'
								},
								example: {
									status: false,
									msg: 'El token proporcionado es inválido'
								}
							}
						}
					},
					'403': {
						description: 'Prohibido',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/Error'
								},
								example: {
									status: false,
									msg: 'Usted no cuenta con permisos para esta ruta'
								}
							}
						}
					},
					'404': {
						description: 'No encontrado',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/Error'
								},
								example: {
									status: false,
									msg: 'No se pudo generar el token del usuario'
								}
							}
						}
					}
				}
			}
		},
		'/clave': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			put: {
				tags: ['Clave'],
				summary: 'Actualizar clave de usuario',
				description: 'Método para actualizar la clave o contraseña de un usuario de la intranet',
				security: [
					{
						token: []
					}
				],
				requestBody: {
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/ClaveRequest'
							},
							examples: {
								clave: {
									summary: 'Un ejemplo de clave',
									value: {
										password: 'secret',
										newPassword: 'secretazo'
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Estado de actualización de la clave',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: {
											type: 'boolean'
										},
										msg: {
											type: 'string'
										}
									},
									example: {
										status: true,
										msg: 'Se actualizó la clave del usuario correctamente'
									}
								}
							}
						}
					},
					'401': {
						description: 'No autorizado',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/Error'
								},
								example: {
									status: false,
									msg: 'El token proporcionado es inválido'
								}
							}
						}
					},
					'403': {
						description: 'Prohibido',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/Error'
								},
								example: {
									status: false,
									msg: 'Usted no cuenta con permisos para esta ruta'
								}
							}
						}
					},
					'404': {
						description: 'No encontrado',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/Error'
								},
								example: {
									status: false,
									msg: 'No se pudo actualizar la clave del usuario'
								}
							}
						}
					}
				}
			}
		}
	},
	components: {
		securitySchemes: {
			token: {
				type: 'apiKey',
				name: 'Authorization',
				description: 'Token de Autorización del API',
				in: 'header'
			}
		},
		parameters: {
			source: {
				in: 'header',
				name: 'source',
				schema: {
					type: 'string',
					default: 'web'
				}
			},
			origin: {
				in: 'header',
				name: 'origin',
				schema: {
					type: 'string',
					default: 'http://localhost:3000'
				}
			},
			ip: {
				in: 'header',
				name: 'ip',
				schema: {
					type: 'string',
					default: '192.168.1.100'
				}
			},
			device: {
				in: 'header',
				name: 'device',
				schema: {
					type: 'string',
					default: 'Laptop'
				}
			},
			browser: {
				in: 'header',
				name: 'browser',
				schema: {
					type: 'string',
					default: 'Chrome'
				}
			}
		},
		schemas: {
			TokenRequest: {
				type: 'object',
				properties: {
					dni: { type: 'string', description: 'DNI del usuario' },
					password: { type: 'string', description: 'Clave del usuario' },
					expires: { type: 'boolen', description: 'Estado de expiración del token de usuario' },
					time: { type: 'string', description: 'Tiempo de expiración del token de usuario' }
				},
				required: ['dni', 'password', 'expires']
			},
			ClaveRequest: {
				type: 'object',
				properties: {
					password: { type: 'string', description: 'Clave de acceso del usuario' },
					newPassword: { type: 'string', description: 'Nueva clave del usuario' }
				},
				required: ['password', 'newPassword']
			},
			RolResponse: {
				type: 'object',
				properties: {
					_id: { type: 'string', description: 'Id del rol' },
					nombre: { type: 'string', description: 'Nombre del rol' },
					super: { type: 'boolean', description: 'Estado que indica si es un superusuario' }
				}
			},
			UsuarioResponse: {
				type: 'object',
				properties: {
					_id: { type: 'string', description: 'Id del usuario' },
					nombres: { type: 'string', description: 'Nombres del usuario' },
					apellido_paterno: { type: 'string', description: 'Apellido paterno del usuario' },
					apellido_materno: { type: 'string', description: 'Apellido materno del usuario' },
					email: { type: 'string', description: 'Email del usuario' },
					dni: { type: 'string', description: 'DNI del usuario' },
					genero: { type: 'string', description: 'Género del usuario' },
					img: { type: 'string', description: 'Ruta de la imagen del usuario' },
					rol: { $ref: '#/components/schemas/RolResponse' }
				}
			},
			Error: {
				type: 'object',
				properties: {
					status: { type: 'boolean', description: 'Estado de la petición' },
					msg: { type: 'string', description: 'Mensaje del error' }
				},
				required: ['nombre']
			}
		}
	}
};
