/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { SwaggerOptions } from 'swagger-ui-express';
import { appNombre, appDescripcion, appEnvironment, appAutorEmail, appAutorName, appAutorWeb } from '../configs';
import { getHost } from '../helpers/host';

/*******************************************************************************************************/
// Variables de las opciones //
/*******************************************************************************************************/
const basePath: string = '/monitor';
const schema: string = 'Monitor';

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
			name: 'Sesiones',
			description: 'Rutas relacionadas a Sesiones de los usuarios de la intranet'
		},
		{
			name: 'Logs',
			description: 'Rutas relacionadas a Logs de eventos de los usuarios de la intranet'
		}
	],
	paths: {
		'/sesiones': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			get: {
				tags: ['Sesiones'],
				summary: 'Obtener lista de sesiones',
				description: 'Método para obtener lista de sesiones de los usuarioas de la intranet',
				parameters: [
					{
						in: 'query',
						name: 'page',
						description: 'Página que se quiere mostrar',
						schema: {
							type: 'integer',
							minimum: 1
						},
						required: true
					},
					{
						in: 'query',
						name: 'pageSize',
						description: 'Número de registros por página',
						schema: {
							type: 'integer',
							minimum: 1
						},
						required: true
					}
				],
				responses: {
					'200': {
						description: 'Lista de sessiones',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: {
											type: 'boolean'
										},
										pagina: {
											type: 'integer'
										},
										totalPaginas: {
											type: 'integer'
										},
										registros: {
											type: 'integer'
										},
										totalRegistros: {
											type: 'integer'
										},
										list: {
											type: 'array',
											items: {
												$ref: '#/components/schemas/SesionResponse'
											}
										}
									},
									example: {
										status: true,
										pagina: 1,
										totalPaginas: 1,
										registros: 2,
										totalRegistros: 2,
										list: [
											{
												_id: '60e00fc129bc965cf8eb76cc',
												usuario: '70e02fc236bc862cf7eb47ab',
												fuente: 'web',
												ip: '192.168.1.100',
												dispositivo: 'Laptop',
												navegador: 'Chrome',
												ultimo_ingreso: 'Viernes 17/09/2021 12:27:19 am',
												primer_ingreso: 'Sábado 11/09/2021 11:52:48 am',
												estado: 'offline'
											},
											{
												_id: '60e00fc129bc965cf8eb76cc',
												usuario: '70e02fc236bc862cf7eb47ab',
												fuente: 'app',
												ip: '192.168.1.100',
												dispositivo: 'IPhone 8',
												navegador: '',
												ultimo_ingreso: 'Viernes 17/09/2021 12:27:19 am',
												primer_ingreso: 'Sábado 11/09/2021 11:52:48 am',
												estado: 'online'
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
									msg: 'No se pudo obtener las sesiones'
								}
							}
						}
					}
				}
			},
			put: {
				tags: ['Sesiones'],
				summary: 'Actualizar los datos una sesión',
				description: 'Método para actualizar los datos de una sesión de usuario de la intranet',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/SesionRequest'
							},
							examples: {
								sesion: {
									summary: 'Un ejemplo de sesion',
									value: {
										estado: 'offline'
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos de la sesión actualizada',
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
										sesion: {
											type: 'object',
											$ref: '#/components/schemas/SesionResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se creó la sesión correctamente',
										sesion: {
											_id: '60e00fc129bc965cf8eb76cc',
											usuario: '70e02fc236bc862cf7eb47ab',
											fuente: 'app',
											ip: '192.168.1.100',
											dispositivo: 'Android 11',
											navegador: '',
											ultimo_ingreso: 'Viernes 17/09/2021 12:27:19 am',
											primer_ingreso: 'Sábado 11/09/2021 11:52:48 am',
											estado: 'online'
										}
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
									msg: 'No se pudo actualizar los datos de la sesión'
								}
							}
						}
					}
				}
			}
		},
		'/logs': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			get: {
				tags: ['Logs'],
				summary: 'Obtener lista de logs',
				description: 'Método para obtener lista de logs de eventos de usuarios de la intranet',
				parameters: [
					{
						in: 'query',
						name: 'page',
						description: 'Página que se quiere mostrar',
						schema: {
							type: 'integer',
							minimum: 1
						},
						required: true
					},
					{
						in: 'query',
						name: 'pageSize',
						description: 'Número de registros por página',
						schema: {
							type: 'integer',
							minimum: 1
						},
						required: true
					}
				],
				responses: {
					'200': {
						description: 'Lista de logs',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: {
											type: 'boolean'
										},
										pagina: {
											type: 'integer'
										},
										totalPaginas: {
											type: 'integer'
										},
										registros: {
											type: 'integer'
										},
										totalRegistros: {
											type: 'integer'
										},
										list: {
											type: 'array',
											items: {
												$ref: '#/components/schemas/LogResponse'
											}
										}
									},
									example: {
										status: true,
										pagina: 1,
										totalPaginas: 1,
										registros: 2,
										totalRegistros: 2,
										list: [
											{
												_id: '60e00fc129bc965cf8eb76cc',
												usuario: '70e02fc236bc862cf7eb47ab',
												fuente: 'web',
												ip: '192.168.1.100',
												dispositivo: 'Laptop',
												navegador: 'Chrome',
												modulo: 'ventas',
												submodulo: 'facturacion',
												controller: 'facturacion.controller',
												funcion: 'create',
												descripcion: 'Crear nuevo comprobante de pago',
												evento: 'crear',
												data_in: '',
												data_out: '{"nombre": "boleta", "serie": "001", "numero": "213"}',
												procesamiento: 'unico',
												registros: 1,
												id_grupo: '60e00fc129bc965cf8eb76cc@2021-09-17T07:51:22.567Z',
												fecha_registro: 'Viernes 17/09/2021 12:27:19 am'
											},
											{
												_id: '60e00fc129bc965cf8eb76cc',
												usuario: '70e02fc236bc862cf7eb47ab',
												fuente: 'app',
												ip: '192.168.1.100',
												dispositivo: 'Iphone 8',
												navegador: '',
												modulo: 'ventas',
												submodulo: 'facturacion',
												controller: 'facturacion.controller',
												funcion: 'update',
												descripcion: 'Actualizar comprobante de pago',
												evento: 'actualizar',
												data_in: '{"nombre": "factura", "serie": "001", "numero": "12"}',
												data_out: '{"nombre": "factura", "serie": "001", "numero": "13"}',
												procesamiento: 'unico',
												registros: 1,
												id_grupo: '60e00fc129bc965cf8eb76cc@2021-09-17T07:51:22.567Z',
												fecha_registro: 'Jueves 16/09/2021 11:13:22 am'
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
									msg: 'No se pudo obtener los logs'
								}
							}
						}
					}
				}
			}
		},
		'/logs/{id}': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' },
				{
					in: 'path',
					name: 'id',
					description: 'ID del log',
					required: true,
					schema: {
						type: 'string'
					}
				}
			],
			get: {
				tags: ['Logs'],
				summary: 'Obtener datos de un log',
				description: 'Método para obtener los datos de un log de evento de un usuario de la intranet',
				responses: {
					'200': {
						description: 'Datos del log consultado',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: {
											type: 'boolean'
										},
										log: {
											type: 'object',
											$ref: '#/components/schemas/LogResponse'
										}
									},
									example: {
										status: true,
										log: {
											_id: '60e00fc129bc965cf8eb76cc',
											usuario: '70e02fc236bc862cf7eb47ab',
											fuente: 'web',
											ip: '192.168.1.100',
											dispositivo: 'Laptop',
											navegador: 'Chrome',
											modulo: 'ventas',
											submodulo: 'facturacion',
											controller: 'facturacion.controller',
											funcion: 'create',
											descripcion: 'Crear nuevo comprobante de pago',
											evento: 'crear',
											data_in: '',
											data_out: '{"nombre": "boleta", "serie": "001", "numero": "213"}',
											procesamiento: 'unico',
											registros: 1,
											id_grupo: '60e00fc129bc965cf8eb76cc@2021-09-17T07:51:22.567Z',
											fecha_registro: 'Viernes 17/09/2021 12:27:19 am'
										}
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
									msg: 'No se pudo obtener los datos del log'
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
			RolResponse: {
				type: 'object',
				properties: {
					_id: { type: 'string', description: 'Id del rol' },
					nombre: { type: 'string', description: 'Nombre del rol' }
				}
			},
			UsuarioResponse: {
				type: 'object',
				properties: {
					_id: { type: 'string', description: 'Id del usuario' },
					nombres: { type: 'string', description: 'Nombres del usuario' },
					apellido_paterno: { type: 'string', description: 'Apellido paterno del usuario' },
					apellido_materno: { type: 'string', description: 'Apellido materno del usuario' },
					rol: { $ref: '#/components/schemas/RolResponse' }
				}
			},
			SesionRequest: {
				type: 'object',
				properties: {
					estado: { type: 'string', enum: ['online', 'busy', 'offline'], description: 'Estado de la sesión' }
				},
				required: ['estado']
			},
			SesionResponse: {
				type: 'object',
				properties: {
					_id: { type: 'string', description: 'Id de la sesión' },
					usuario: { $ref: '#/components/schemas/UsuarioResponse' },
					fuente: {
						type: 'string',
						enum: ['web', 'app', 'desktop'],
						description: 'Fuente de acceso del usuario'
					},
					ip: { type: 'string', description: 'IP de acceso del usuario' },
					dispositivo: { type: 'string', description: 'Dispositivo de acceso del usuario' },
					navegador: { type: 'string', description: 'Navegador de acceso del usuario' },
					ultimo_ingreso: { type: 'string', description: 'Último ingreso del usuario' },
					primer_ingreso: { type: 'string', description: 'Primer ingreso del usuario' },
					estado: { type: 'string', enum: ['online', 'busy', 'offline'], description: 'Estado de la sesión' }
				}
			},
			LogResponse: {
				type: 'object',
				properties: {
					_id: { type: 'string', description: 'Id del log' },
					usuario: { $ref: '#/components/schemas/UsuarioResponse' },
					fuente: {
						type: 'string',
						enum: ['web', 'app', 'desktop'],
						description: 'Fuente del evento del usuario'
					},
					origen: { type: 'string', description: 'Origen del evento del usuario' },
					ip: { type: 'string', description: 'IP del evento del usuario' },
					dispositivo: { type: 'string', description: 'Dispositivo del evento del usuario' },
					navegador: { type: 'string', description: 'Navegador del evento del usuario' },
					modulo: { type: 'string', description: 'Módulo del evento del usuario' },
					submodulo: { type: 'string', description: 'Submódulo del evento del usuario' },
					controller: { type: 'string', description: 'Controlador del evento del usuario' },
					funcion: { type: 'string', description: 'Función del evento del usuario' },
					descripcion: { type: 'string', description: 'Descripción del evento del usuario' },
					evento: { type: 'string', description: 'Evento del usuario' },
					data_in: { type: 'string', description: 'Data de Ingreso del evento del usuario' },
					data_out: { type: 'string', description: 'Data de Salida del evento del usuario' },
					procesamiento: { type: 'string', description: 'Procesamiento del evento del usuario' },
					registros: { type: 'integer', description: 'Registros del evento del usuario' },
					id_grupo: { type: 'string', description: 'Id del grupo del evento del usuario' },
					fecha_registro: { type: 'string', description: 'Fecha de registro del evento del usuario' }
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
	},
	security: [
		{
			token: []
		}
	]
};
