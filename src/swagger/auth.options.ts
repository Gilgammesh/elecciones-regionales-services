/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { SwaggerOptions } from 'swagger-ui-express';
import { appNombre, appDescripcion, appEnvironment, appAutorEmail, appAutorName, appAutorWeb } from '../configs';
import { getHost } from '../helpers/host';

/*******************************************************************************************************/
// Variables de las opciones //
/*******************************************************************************************************/
const basePath: string = '/auth';
const schema: string = 'Autenticación';

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
			name: 'Auth',
			description: 'Rutas relacionadas a Autenticación de los usuarios de la intranet'
		}
	],
	paths: {
		'/check': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			post: {
				tags: ['Auth'],
				summary: 'Chequear el token de usuario',
				description: 'Método para chequear o validar el token de usuario de la intranet',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/TokenRequest'
							},
							examples: {
								token: {
									summary: 'Un ejemplo de token',
									value: {
										token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos del usuario y permisos',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: {
											type: 'boolean'
										},
										usuario: {
											type: 'object',
											$ref: '#/components/schemas/UsuarioResponse'
										},
										permisos: {
											type: 'array',
											$ref: '#/components/schemas/PermisosResponse'
										}
									},
									example: {
										status: true,
										usuario: {
											_id: '60e00fc129bc965cf8eb76cd',
											nombres: 'Carlos',
											apellido_paterno: 'Santander',
											apellido_materno: 'Ruiz',
											email: 'correo@gmail.com',
											dni: '12345678',
											genero: 'M',
											img: 'http://localhost:4000/uploads/image001.jpg',
											rol: {
												_id: '60e00fc129bc965cf8eb76cd',
												nombre: 'ROL_ADMIN',
												super: false
											}
										},
										permisos: [
											{
												_id: '60e00fc129bc965cf8eb76cc',
												modulo: 'admin',
												acciones: ['ver', 'crear', 'editar', 'eliminar'],
												permisos: [
													{
														_id: '60e00fc129bc965cf8eb76cc',
														submodulo: 'usuarios',
														acciones: ['ver', 'crear', 'editar', 'eliminar']
													},
													{
														_id: '60e00fc129bc965cf8eb76cc',
														submodulo: 'roles',
														acciones: ['ver', 'crear', 'editar', 'eliminar']
													}
												]
											},
											{
												_id: '60e00fc129bc965cf8eb76cc',
												modulo: 'venta',
												acciones: ['ver', 'crear', 'editar', 'eliminar'],
												permisos: [
													{
														_id: '60e00fc129bc965cf8eb76cc',
														submodulo: 'compras',
														acciones: ['ver', 'crear', 'editar', 'eliminar']
													},
													{
														_id: '60e00fc129bc965cf8eb76cc',
														submodulo: 'facturacion',
														acciones: ['ver', 'crear', 'editar', 'eliminar']
													}
												]
											}
										]
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
									msg: 'El usuario está deshabilitado'
								}
							}
						}
					}
				}
			}
		},
		'/login': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			post: {
				tags: ['Auth'],
				summary: 'Inicio de sesión del usuario',
				description: 'Método para iniciar la sesión del usuario en la intranet y generar su token',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/UsuarioRequest'
							},
							examples: {
								usuario: {
									summary: 'Un ejemplo de usuario',
									value: {
										dni: '12345678',
										password: 'secret'
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos del usuario y permisos',
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
										},
										usuario: {
											type: 'object',
											$ref: '#/components/schemas/UsuarioResponse'
										},
										permisos: {
											type: 'array',
											$ref: '#/components/schemas/PermisosResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se inició la sesión correctamente',
										usuario: {
											_id: '60e00fc129bc965cf8eb76cd',
											nombres: 'Carlos',
											apellido_paterno: 'Santander',
											apellido_materno: 'Ruiz',
											email: 'correo@gmail.com',
											dni: '12345678',
											genero: 'M',
											img: 'http://localhost:4000/uploads/image001.jpg',
											rol: {
												_id: '60e00fc129bc965cf8eb76cd',
												nombre: 'ROL_ADMIN',
												super: false
											}
										},
										permisos: [
											{
												_id: '60e00fc129bc965cf8eb76cc',
												modulo: 'admin',
												acciones: ['ver', 'crear', 'editar', 'eliminar'],
												permisos: [
													{
														_id: '60e00fc129bc965cf8eb76cc',
														submodulo: 'usuarios',
														acciones: ['ver', 'crear', 'editar', 'eliminar']
													},
													{
														_id: '60e00fc129bc965cf8eb76cc',
														submodulo: 'roles',
														acciones: ['ver', 'crear', 'editar', 'eliminar']
													}
												]
											},
											{
												_id: '60e00fc129bc965cf8eb76cc',
												modulo: 'venta',
												acciones: ['ver', 'crear', 'editar', 'eliminar'],
												permisos: [
													{
														_id: '60e00fc129bc965cf8eb76cc',
														submodulo: 'compras',
														acciones: ['ver', 'crear', 'editar', 'eliminar']
													},
													{
														_id: '60e00fc129bc965cf8eb76cc',
														submodulo: 'facturacion',
														acciones: ['ver', 'crear', 'editar', 'eliminar']
													}
												]
											}
										]
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
									msg: 'El usuario no existe'
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
									msg: 'El usuario está desactivado'
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
									msg: 'Hubo un error en la validación del usuario'
								}
							}
						}
					}
				}
			}
		},
		'/logout': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			post: {
				tags: ['Auth'],
				summary: 'Cierre de sesión del usuario',
				description: 'Método para cerrar la sesión del usuario en la intranet',
				security: [
					{
						token: []
					}
				],
				responses: {
					'200': {
						description: 'Aviso de confirmación del cierre de sesión',
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
										msg: 'Se cerró la sesión del usuario correctamente'
									}
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
									msg: 'No se pudo cerrar sesión del usuario'
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
					token: { type: 'string', description: 'Token del usuario' }
				},
				required: ['token']
			},
			PermisosResponse: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						modulo: { type: 'string', description: 'Módulo permitido' },
						acciones: {
							type: 'array',
							description: 'Acciones permitidas en el módulo',
							items: { type: 'string' }
						},
						permisos: {
							type: 'array',
							description: 'Permisos de submódulos del módulo del rol de usuario',
							items: {
								type: 'object',
								properties: {
									submodulo: { type: 'string', description: 'Submódulo permitido' },
									acciones: {
										type: 'array',
										description: 'Acciones permitidas en el submódulo',
										items: { type: 'string' }
									}
								}
							}
						}
					}
				}
			},
			RolResponse: {
				type: 'object',
				properties: {
					_id: { type: 'string', description: 'Id del rol' },
					nombre: { type: 'string', description: 'Nombre del rol' },
					super: {
						type: 'boolean',
						description: 'Estado que indica si es un superusuario'
					}
				}
			},
			UsuarioRequest: {
				type: 'object',
				properties: {
					dni: { type: 'string', description: 'DNI del usuario' },
					password: { type: 'string', description: 'Clave del usuario' }
				},
				required: ['dni', 'password']
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
					rol: {
						$ref: '#/components/schemas/RolResponse'
					}
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
