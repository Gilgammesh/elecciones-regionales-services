/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { SwaggerOptions } from 'swagger-ui-express';
import { appNombre, appDescripcion, appEnvironment, appAutorEmail, appAutorName, appAutorWeb } from '../configs';
import { getHost } from '../helpers/host';

/*******************************************************************************************************/
// Variables de las opciones //
/*******************************************************************************************************/
const basePath: string = '/admin';
const schema: string = 'Administrativo';

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
			name: 'Acciones',
			description: 'Rutas relacionadas a Acciones permitidas en los módulos'
		},
		{
			name: 'Modulos',
			description: 'Rutas relacionadas a Módulos y Submódulos de la Intranet'
		},
		{
			name: 'Roles',
			description: 'Rutas relacionadas a Roles y Permisos de Usuario'
		},
		{
			name: 'Usuarios',
			description: 'Rutas relacionadas a Usuarios de la Intranet'
		}
	],
	paths: {
		'/acciones': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			get: {
				tags: ['Acciones'],
				summary: 'Obtener lista de acciones',
				description:
					'Método para obtener lista de acciones que tiene permitidas un usuario en un módulo o submódulo',
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
						description: 'Lista de acciones',
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
												$ref: '#/components/schemas/AccionResponse'
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
												nombre: 'ver',
												descripcion: 'Leer registros'
											},
											{
												_id: '60e00fc129bc965cf8eb76cd',
												nombre: 'crear',
												descripcion: 'Crear nuevos registros'
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
									msg: 'No se pudo obtener las acciones'
								}
							}
						}
					}
				}
			},
			post: {
				tags: ['Acciones'],
				summary: 'Crear una nueva acción',
				description: 'Método para crear una nueva acción permitida para un módulo o submódulo',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/AccionRequest'
							},
							examples: {
								accion: {
									summary: 'Un ejemplo de acción',
									value: {
										nombre: 'eliminar',
										descripcion: 'Eliminar o borrar registros'
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos de la acción creada',
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
										accion: {
											type: 'object',
											$ref: '#/components/schemas/AccionResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se creó la acción correctamente',
										accion: {
											_id: '60e00fc129bc965cf8eb76cd',
											nombre: 'eliminar',
											descripcion: 'Eliminar o borrar registros'
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
									msg: 'No se pudo crear la acción'
								}
							}
						}
					}
				}
			}
		},
		'/acciones/{id}': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' },
				{
					in: 'path',
					name: 'id',
					description: 'ID de la acción',
					required: true,
					schema: {
						type: 'string'
					}
				}
			],
			get: {
				tags: ['Acciones'],
				summary: 'Obtener datos de una acción',
				description: 'Método para obtener los datos de una acción permitida para un módulo o submódulo',
				responses: {
					'200': {
						description: 'Datos de la acción consultada',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: {
											type: 'boolean'
										},
										accion: {
											type: 'object',
											$ref: '#/components/schemas/AccionResponse'
										}
									},
									example: {
										status: true,
										accion: {
											_id: '60e00fc129bc965cf8eb76cd',
											nombre: 'crear',
											descripcion: 'Crear nuevos registros'
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
									msg: 'No se pudo obtener los datos de la acción'
								}
							}
						}
					}
				}
			},
			put: {
				tags: ['Acciones'],
				summary: 'Actualizar datos de una acción',
				description: 'Método para actualizar los datos una acción permitida para un módulo o submódulo',
				parameters: [
					{
						in: 'path',
						name: 'id',
						description: 'ID de la acción',
						required: true,
						schema: {
							type: 'string'
						}
					}
				],
				requestBody: {
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/AccionRequest'
							},
							examples: {
								accion: {
									summary: 'Un ejemplo de acción',
									value: {
										nombre: 'editar',
										descripcion: 'Modificar y actualizar registros'
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos de la acción actualizada',
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
										accion: {
											type: 'object',
											$ref: '#/components/schemas/AccionResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se actualizó la acción correctamente',
										accion: {
											_id: '60e00fc129bc965cf8eb76cd',
											nombre: 'editar',
											descripcion: 'Modificar y actualizar registros'
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
									msg: 'No se pudo actualizar la acción'
								}
							}
						}
					}
				}
			},
			delete: {
				tags: ['Acciones'],
				summary: 'Eliminar una acción',
				description: 'Método para eliminar una acción permitida para un módulo o submódulo',
				parameters: [
					{
						in: 'path',
						name: 'id',
						description: 'ID de la acción',
						required: true,
						schema: {
							type: 'string'
						}
					}
				],
				responses: {
					'200': {
						description: 'Datos de la acción eliminada',
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
										accion: {
											type: 'object',
											$ref: '#/components/schemas/AccionResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se eliminó la acción correctamente',
										accion: {
											_id: '60e00fc129bc965cf8eb76cd',
											nombre: 'eliminar',
											descripcion: 'Eliminar o borrar registros'
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
									msg: 'No se pudo eliminar la acción'
								}
							}
						}
					}
				}
			}
		},
		'/modulos': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			get: {
				tags: ['Modulos'],
				summary: 'Obtener lista de módulos',
				description: 'Método para obtener lista de modulos de la intranet',
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
						description: 'Lista de módulos',
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
												$ref: '#/components/schemas/ModuloResponse'
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
												orden: 1,
												tag: 'admin',
												nombre: 'Administrativo',
												descripcion:
													'Módulo para gestionar la administración y mantenimiento de la intranet',
												icon: 'security',
												type: 'collapse',
												submodulos: [
													{
														_id: '60e00fc129bc965cf8eb76cc',
														orden: 1,
														tag: 'usuarios',
														nombre: 'Usuarios',
														descripcion:
															'Submódulo para gestionar los usuarios de la intranet',
														type: 'item',
														url: '/admin/usuarios',
														estado: true
													},
													{
														_id: '60e00fc129bc965cf8eb76cc',
														orden: 2,
														tag: 'roles',
														nombre: 'Roles',
														descripcion:
															'Submódulo para gestionar los roles y permisos de la intranet',
														type: 'item',
														url: '/admin/roles',
														estado: true
													}
												],
												estado: true
											},
											{
												_id: '60e00fc129bc965cf8eb76cc',
												orden: 1,
												tag: 'reportes',
												nombre: 'Reportes',
												descripcion: 'Módulo para gestionar los reportes de la intranet',
												icon: 'assignment',
												type: 'item',
												estado: true
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
									msg: 'No se pudo obtener los módulos'
								}
							}
						}
					}
				}
			},
			post: {
				tags: ['Modulos'],
				summary: 'Crear un nuevo módulo',
				description: 'Método para crear un nuevo módulo de la intranet',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/ModuloRequest'
							},
							examples: {
								modulo: {
									summary: 'Un ejemplo de módulo',
									value: {
										orden: 2,
										tag: 'ventas',
										nombre: 'Ventas',
										descripcion: 'Módulo para gestionar las ventas',
										icon: 'shopping',
										type: 'collapse',
										submodulos: [
											{
												orden: 1,
												tag: 'punto_venta',
												nombre: 'Punto de Venta',
												descripcion: 'Submódulo para gestionar los puntos de venta',
												type: 'item',
												url: '/venta/punto_venta',
												estado: true
											},
											{
												orden: 2,
												tag: 'facturacion',
												nombre: 'Facturación',
												descripcion: 'Submódulo para gestionar la facturación de las ventas',
												type: 'item',
												url: '/venta/facturacion',
												estado: true
											}
										],
										estado: true
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos del módulo creado',
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
										modulo: {
											type: 'object',
											$ref: '#/components/schemas/ModuloResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se creó el módulo correctamente',
										modulo: {
											orden: 2,
											tag: 'ventas',
											nombre: 'Ventas',
											descripcion: 'Módulo para gestionar las ventas',
											icon: 'shopping',
											type: 'collapse',
											submodulos: [
												{
													orden: 1,
													tag: 'punto_venta',
													nombre: 'Punto de Venta',
													descripcion: 'Submódulo para gestionar los puntos de venta',
													type: 'item',
													url: '/venta/punto_venta',
													estado: true
												},
												{
													orden: 2,
													tag: 'facturacion',
													nombre: 'Facturación',
													descripcion:
														'Submódulo para gestionar la facturación de las ventas',
													type: 'item',
													url: '/venta/facturacion',
													estado: true
												}
											],
											estado: true
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
									msg: 'No se pudo crear el módulo'
								}
							}
						}
					}
				}
			}
		},
		'/modulos/{id}': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' },
				{
					in: 'path',
					name: 'id',
					description: 'ID del módulo',
					required: true,
					schema: {
						type: 'string'
					}
				}
			],
			get: {
				tags: ['Modulos'],
				summary: 'Obtener datos de un módulo',
				description: 'Método para obtener los datos de un módulo de la intranet',
				responses: {
					'200': {
						description: 'Datos del módulo consultado',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: {
											type: 'boolean'
										},
										modulo: {
											type: 'object',
											$ref: '#/components/schemas/ModuloResponse'
										}
									},
									example: {
										status: true,
										accion: {
											_id: '60e00fc129bc965cf8eb76cd',
											orden: 2,
											tag: 'ventas',
											nombre: 'Ventas',
											descripcion: 'Módulo para gestionar las ventas',
											icon: 'shopping',
											type: 'collapse',
											submodulos: [
												{
													_id: '60e00fc129bc965cf8eb76cd',
													orden: 1,
													tag: 'punto_venta',
													nombre: 'Punto de Venta',
													descripcion: 'Submódulo para gestionar los puntos de venta',
													type: 'item',
													url: '/venta/punto_venta',
													estado: true
												},
												{
													_id: '60e00fc129bc965cf8eb76cd',
													orden: 2,
													tag: 'facturacion',
													nombre: 'Facturación',
													descripcion:
														'Submódulo para gestionar la facturación de las ventas',
													type: 'item',
													url: '/venta/facturacion',
													estado: true
												}
											],
											estado: true
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
									msg: 'No se pudo obtener los datos del módulo'
								}
							}
						}
					}
				}
			},
			put: {
				tags: ['Modulos'],
				summary: 'Actualizar datos de un módulo',
				description: 'Método para actualizar los datos un módulo de la intranet',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/ModuloRequest'
							},
							examples: {
								accion: {
									summary: 'Un ejemplo de módulo',
									value: {
										orden: 2,
										tag: 'ventas',
										nombre: 'Ventas',
										descripcion: 'Módulo para gestionar las ventas',
										icon: 'shopping',
										type: 'collapse',
										submodulos: [
											{
												orden: 1,
												tag: 'punto_venta',
												nombre: 'Punto de Venta',
												descripcion: 'Submódulo para gestionar los puntos de venta',
												type: 'item',
												url: '/venta/punto_venta',
												estado: true
											},
											{
												orden: 2,
												tag: 'facturacion',
												nombre: 'Facturación',
												descripcion: 'Submódulo para gestionar la facturación de las ventas',
												type: 'item',
												url: '/venta/facturacion',
												estado: true
											}
										],
										estado: true
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos del módulo actualizado',
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
										modulo: {
											type: 'object',
											$ref: '#/components/schemas/ModuloResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se actualizó el módulo correctamente',
										modulo: {
											_id: '60e00fc129bc965cf8eb76cd',
											orden: 2,
											tag: 'ventas',
											nombre: 'Ventas',
											descripcion: 'Módulo para gestionar las ventas',
											icon: 'shopping',
											type: 'collapse',
											submodulos: [
												{
													_id: '60e00fc129bc965cf8eb76cd',
													orden: 1,
													tag: 'punto_venta',
													nombre: 'Punto de Venta',
													descripcion: 'Submódulo para gestionar los puntos de venta',
													type: 'item',
													url: '/venta/punto_venta',
													estado: true
												},
												{
													_id: '60e00fc129bc965cf8eb76cd',
													orden: 2,
													tag: 'facturacion',
													nombre: 'Facturación',
													descripcion:
														'Submódulo para gestionar la facturación de las ventas',
													type: 'item',
													url: '/venta/facturacion',
													estado: true
												}
											],
											estado: true
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
									msg: 'No se pudo actualizar los datos del módulo'
								}
							}
						}
					}
				}
			},
			delete: {
				tags: ['Modulos'],
				summary: 'Eliminar un módulo',
				description: 'Método para eliminar un módulo de la intranet',
				responses: {
					'200': {
						description: 'Datos del módulo eliminado',
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
										modulo: {
											type: 'object',
											$ref: '#/components/schemas/ModuloResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se eliminó el módulo correctamente',
										accion: {
											_id: '60e00fc129bc965cf8eb76cd',
											orden: 2,
											tag: 'ventas',
											nombre: 'Ventas',
											descripcion: 'Módulo para gestionar las ventas',
											icon: 'shopping',
											type: 'collapse',
											submodulos: [
												{
													_id: '60e00fc129bc965cf8eb76cd',
													orden: 1,
													tag: 'punto_venta',
													nombre: 'Punto de Venta',
													descripcion: 'Submódulo para gestionar los puntos de venta',
													type: 'item',
													url: '/venta/punto_venta',
													estado: true
												},
												{
													_id: '60e00fc129bc965cf8eb76cd',
													orden: 2,
													tag: 'facturacion',
													nombre: 'Facturación',
													descripcion:
														'Submódulo para gestionar la facturación de las ventas',
													type: 'item',
													url: '/venta/facturacion',
													estado: true
												}
											],
											estado: true
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
									msg: 'No se pudo eliminar el módulo'
								}
							}
						}
					}
				}
			}
		},
		'/roles': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			get: {
				tags: ['Roles'],
				summary: 'Obtener lista de roles',
				description: 'Método para obtener lista de roles de usuario de la intranet',
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
						description: 'Lista de roles',
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
												$ref: '#/components/schemas/RolResponse'
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
												prioridad: 1,
												nombre: 'ROL_ADMIN',
												descripcion: 'Rol del administrador de la intranet',
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
												],
												estado: true
											},
											{
												_id: '60e00fc129bc965cf8eb76cc',
												prioridad: 1,
												nombre: 'ROL_INVITADO',
												descripcion: 'Rol de invitado de la intranet',
												permisos: [
													{
														_id: '60e00fc129bc965cf8eb76cc',
														modulo: 'admin',
														acciones: ['ver'],
														permisos: [
															{
																_id: '60e00fc129bc965cf8eb76cc',
																submodulo: 'usuarios',
																acciones: ['ver']
															},
															{
																_id: '60e00fc129bc965cf8eb76cc',
																submodulo: 'roles',
																acciones: ['ver']
															}
														]
													},
													{
														_id: '60e00fc129bc965cf8eb76cc',
														modulo: 'venta',
														acciones: ['ver'],
														permisos: [
															{
																_id: '60e00fc129bc965cf8eb76cc',
																submodulo: 'compras',
																acciones: ['ver']
															},
															{
																_id: '60e00fc129bc965cf8eb76cc',
																submodulo: 'facturacion',
																acciones: ['ver']
															}
														]
													}
												],
												estado: true
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
									msg: 'No se pudo obtener los roles'
								}
							}
						}
					}
				}
			},
			post: {
				tags: ['Roles'],
				summary: 'Crear un nuevo rol',
				description: 'Método para crear un nuevo rol de usuario de la intranet',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/RolRequest'
							},
							examples: {
								rol: {
									summary: 'Un ejemplo de rol',
									value: {
										prioridad: 1,
										nombre: 'ROL_INVITADO',
										descripcion: 'Rol de invitado de la intranet',
										permisos: [
											{
												modulo: 'admin',
												acciones: ['ver'],
												permisos: [
													{ submodulo: 'usuarios', acciones: ['ver'] },
													{ submodulo: 'roles', acciones: ['ver'] }
												]
											},
											{
												acciones: ['ver'],
												permisos: [
													{ submodulo: 'compras', acciones: ['ver'] },
													{ submodulo: 'facturacion', acciones: ['ver'] }
												]
											}
										],
										estado: true
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos del rol creado',
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
										rol: {
											type: 'object',
											$ref: '#/components/schemas/RolResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se creó el rol correctamente',
										rol: {
											_id: '60e00fc129bc965cf8eb76cd',
											prioridad: 1,
											nombre: 'ROL_INVITADO',
											descripcion: 'Rol de invitado de la intranet',
											permisos: [
												{
													modulo: 'admin',
													acciones: ['ver'],
													permisos: [
														{ submodulo: 'usuarios', acciones: ['ver'] },
														{ submodulo: 'roles', acciones: ['ver'] }
													]
												},
												{
													acciones: ['ver'],
													permisos: [
														{ submodulo: 'compras', acciones: ['ver'] },
														{ submodulo: 'facturacion', acciones: ['ver'] }
													]
												}
											],
											estado: true
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
									msg: 'No se pudo crear el rol'
								}
							}
						}
					}
				}
			}
		},
		'/roles/{id}': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' },
				{
					in: 'path',
					name: 'id',
					description: 'ID del rol',
					required: true,
					schema: {
						type: 'string'
					}
				}
			],
			get: {
				tags: ['Roles'],
				summary: 'Obtener datos de un rol',
				description: 'Método para obtener los datos de un rol de usuario de la intranet',
				responses: {
					'200': {
						description: 'Datos del rol consultado',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: {
											type: 'boolean'
										},
										rol: {
											type: 'object',
											$ref: '#/components/schemas/RolResponse'
										}
									},
									example: {
										status: true,
										rol: {
											_id: '60e00fc129bc965cf8eb76cd',
											prioridad: 1,
											nombre: 'ROL_INVITADO',
											descripcion: 'Rol de invitado de la intranet',
											permisos: [
												{
													modulo: 'admin',
													acciones: ['ver'],
													permisos: [
														{ submodulo: 'usuarios', acciones: ['ver'] },
														{ submodulo: 'roles', acciones: ['ver'] }
													]
												},
												{
													acciones: ['ver'],
													permisos: [
														{ submodulo: 'compras', acciones: ['ver'] },
														{ submodulo: 'facturacion', acciones: ['ver'] }
													]
												}
											],
											estado: true
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
									msg: 'No se pudo obtener los datos del rol'
								}
							}
						}
					}
				}
			},
			put: {
				tags: ['Roles'],
				summary: 'Actualizar datos de un rol',
				description: 'Método para actualizar los datos un rol de usuario de la intranet',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/RolRequest'
							},
							examples: {
								rol: {
									summary: 'Un ejemplo de rol',
									value: {
										prioridad: 1,
										nombre: 'ROL_INVITADO',
										descripcion: 'Rol de invitado de la intranet',
										permisos: [
											{
												modulo: 'admin',
												acciones: ['ver'],
												permisos: [
													{ submodulo: 'usuarios', acciones: ['ver'] },
													{ submodulo: 'roles', acciones: ['ver'] }
												]
											},
											{
												acciones: ['ver'],
												permisos: [
													{ submodulo: 'compras', acciones: ['ver'] },
													{ submodulo: 'facturacion', acciones: ['ver'] }
												]
											}
										],
										estado: true
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos del rol actualizado',
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
										rol: {
											type: 'object',
											$ref: '#/components/schemas/RolResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se actualizó el rol correctamente',
										rol: {
											prioridad: 1,
											nombre: 'ROL_INVITADO',
											descripcion: 'Rol de invitado de la intranet',
											permisos: [
												{
													modulo: 'admin',
													acciones: ['ver'],
													permisos: [
														{ submodulo: 'usuarios', acciones: ['ver'] },
														{ submodulo: 'roles', acciones: ['ver'] }
													]
												},
												{
													acciones: ['ver'],
													permisos: [
														{ submodulo: 'compras', acciones: ['ver'] },
														{ submodulo: 'facturacion', acciones: ['ver'] }
													]
												}
											],
											estado: true
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
									msg: 'No se pudo actualizar los datos del rol'
								}
							}
						}
					}
				}
			},
			delete: {
				tags: ['Roles'],
				summary: 'Eliminar un rol',
				description: 'Método para eliminar un rol de usuario de la intranet',
				responses: {
					'200': {
						description: 'Datos del rol eliminado',
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
										rol: {
											type: 'object',
											$ref: '#/components/schemas/RolResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se eliminó el rol correctamente',
										rol: {
											_id: '60e00fc129bc965cf8eb76cd',
											prioridad: 1,
											nombre: 'ROL_INVITADO',
											descripcion: 'Rol de invitado de la intranet',
											permisos: [
												{
													modulo: 'admin',
													acciones: ['ver'],
													permisos: [
														{ submodulo: 'usuarios', acciones: ['ver'] },
														{ submodulo: 'roles', acciones: ['ver'] }
													]
												},
												{
													acciones: ['ver'],
													permisos: [
														{ submodulo: 'compras', acciones: ['ver'] },
														{ submodulo: 'facturacion', acciones: ['ver'] }
													]
												}
											],
											estado: true
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
									msg: 'No se pudo eliminar el rol'
								}
							}
						}
					}
				}
			}
		},
		'/usuarios': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			get: {
				tags: ['Usuarios'],
				summary: 'Obtener lista de usuarios',
				description: 'Método para obtener lista de usuarios de la intranet',
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
						description: 'Lista de usuarios',
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
												$ref: '#/components/schemas/UsuarioResponse'
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
												nombres: 'Carlos',
												apellido_paterno: 'Santander',
												apellido_materno: 'Ruiz',
												email: 'correo@gmail.com',
												dni: '12345678',
												genero: 'M',
												img: 'http://localhost:4000/uploads/image001.jpg',
												rol: {
													_id: '60e00fc129bc965cf8eb76cc',
													prioridad: 1,
													nombre: 'ROL_ADMIN',
													descripcion: 'Rol del administrador de la intranet',
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
													],
													estado: true
												},
												estado: true
											},
											{
												_id: '60e00fc129bc965cf8eb76cc',
												nombres: 'Delia',
												apellido_paterno: 'Chia',
												apellido_materno: 'Ly',
												email: 'email@gmail.com',
												dni: '23456789',
												genero: 'F',
												img: 'http://localhost:4000/uploads/image002.jpg',
												rol: {
													_id: '60e00fc129bc965cf8eb76cc',
													prioridad: 1,
													nombre: 'ROL_INVITADO',
													descripcion: 'Rol de invitado de la intranet',
													permisos: [
														{
															_id: '60e00fc129bc965cf8eb76cc',
															modulo: 'admin',
															acciones: ['ver'],
															permisos: [
																{
																	_id: '60e00fc129bc965cf8eb76cc',
																	submodulo: 'usuarios',
																	acciones: ['ver']
																},
																{
																	_id: '60e00fc129bc965cf8eb76cc',
																	submodulo: 'roles',
																	acciones: ['ver']
																}
															]
														},
														{
															_id: '60e00fc129bc965cf8eb76cc',
															modulo: 'venta',
															acciones: ['ver'],
															permisos: [
																{
																	_id: '60e00fc129bc965cf8eb76cc',
																	submodulo: 'compras',
																	acciones: ['ver']
																},
																{
																	_id: '60e00fc129bc965cf8eb76cc',
																	submodulo: 'facturacion',
																	acciones: ['ver']
																}
															]
														}
													],
													estado: true
												},
												estado: true
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
									msg: 'No se pudo obtener los usuarios'
								}
							}
						}
					}
				}
			},
			post: {
				tags: ['Usuarios'],
				summary: 'Crear un nuevo usuario',
				description: 'Método para crear un nuevo usuario de la intranet',
				requestBody: {
					content: {
						'multipart/form-data': {
							schema: {
								$ref: '#/components/schemas/UsuarioRequest'
							},
							encoding: {
								file: {
									contentType: 'image/jpeg'
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos del usuario creado',
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
										}
									},
									example: {
										status: true,
										msg: 'Se creó el usuario correctamente',
										usuario: {
											_id: '60e00fc129bc965cf8eb76cc',
											nombres: 'Carlos',
											apellido_paterno: 'Santander',
											apellido_materno: 'Ruiz',
											email: 'correo@gmail.com',
											dni: '12345678',
											genero: 'M',
											img: 'http://localhost:4000/uploads/image001.jpg',
											rol: {
												_id: '60e00fc129bc965cf8eb76cc',
												prioridad: 1,
												nombre: 'ROL_ADMIN',
												descripcion: 'Rol del administrador de la intranet',
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
												],
												estado: true
											},
											estado: true
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
									msg: 'No se pudo crear el usuario'
								}
							}
						}
					}
				}
			}
		},
		'/usuarios/{id}': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' },
				{
					in: 'path',
					name: 'id',
					description: 'ID del usuario',
					required: true,
					schema: {
						type: 'string'
					}
				}
			],
			get: {
				tags: ['Usuarios'],
				summary: 'Obtener datos de un usuario',
				description: 'Método para obtener los datos de un usuario de la intranet',
				responses: {
					'200': {
						description: 'Datos del usuario consultado',
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
										}
									},
									example: {
										status: true,
										usuario: {
											_id: '60e00fc129bc965cf8eb76cc',
											nombres: 'Carlos',
											apellido_paterno: 'Santander',
											apellido_materno: 'Ruiz',
											email: 'correo@gmail.com',
											dni: '12345678',
											genero: 'M',
											img: 'http://localhost:4000/uploads/image001.jpg',
											rol: {
												_id: '60e00fc129bc965cf8eb76cc',
												prioridad: 1,
												nombre: 'ROL_ADMIN',
												descripcion: 'Rol del administrador de la intranet',
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
												],
												estado: true
											}
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
									msg: 'No se pudo obtener los datos del usuario'
								}
							}
						}
					}
				}
			},
			put: {
				tags: ['Usuarios'],
				summary: 'Actualizar datos de un usuario',
				description: 'Método para actualizar los datos un usuario de la intranet',
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
										nombres: 'Carlos',
										apellido_paterno: 'Santander',
										apellido_materno: 'Ruiz',
										email: 'correo@gmail.com',
										dni: '12345678',
										genero: 'M',
										password: 'secret',
										rol: '60e00fc129bc965cf8eb76cc',
										estado: true
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos del usuario actualizado',
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
										}
									},
									example: {
										status: true,
										msg: 'Se actualizó el usuario correctamente',
										usuario: {
											_id: '60e00fc129bc965cf8eb76cc',
											nombres: 'Carlos',
											apellido_paterno: 'Santander',
											apellido_materno: 'Ruiz',
											email: 'correo@gmail.com',
											dni: '12345678',
											genero: 'M',
											img: 'http://localhost:4000/uploads/image001.jpg',
											rol: {
												_id: '60e00fc129bc965cf8eb76cc',
												prioridad: 1,
												nombre: 'ROL_ADMIN',
												descripcion: 'Rol del administrador de la intranet',
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
												],
												estado: true
											},
											estado: true
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
									msg: 'No se pudo actualizar los datos del usuario'
								}
							}
						}
					}
				}
			},
			delete: {
				tags: ['Usuarios'],
				summary: 'Eliminar un usuario',
				description: 'Método para eliminar un usuario de la intranet',
				responses: {
					'200': {
						description: 'Datos del usuario eliminado',
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
										}
									},
									example: {
										status: true,
										msg: 'Se eliminó el usuario correctamente',
										usuario: {
											_id: '60e00fc129bc965cf8eb76cc',
											nombres: 'Carlos',
											apellido_paterno: 'Santander',
											apellido_materno: 'Ruiz',
											email: 'correo@gmail.com',
											dni: '12345678',
											genero: 'M',
											img: 'http://localhost:4000/uploads/image001.jpg',
											rol: {
												_id: '60e00fc129bc965cf8eb76cc',
												prioridad: 1,
												nombre: 'ROL_ADMIN',
												descripcion: 'Rol del administrador de la intranet',
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
												],
												estado: true
											},
											estado: true
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
									msg: 'No se pudo eliminar el usuario'
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
			AccionRequest: {
				type: 'object',
				properties: {
					nombre: { type: 'string', description: 'Nombre de la acción' },
					descripcion: { type: 'string', description: 'Descripción de la acción' }
				},
				required: ['nombre']
			},
			AccionResponse: {
				type: 'object',
				properties: {
					_id: { type: 'string', description: 'Id de la acción' },
					nombre: { type: 'string', description: 'Nombre de la acción' },
					descripcion: { type: 'string', description: 'Descripción de la acción' }
				}
			},
			ModuloRequest: {
				type: 'object',
				properties: {
					orden: { type: 'integer', description: 'Orden del módulo' },
					tag: { type: 'string', description: 'Tag o etiqueta del módulo' },
					nombre: { type: 'string', description: 'Nombre del módulo' },
					descripcion: { type: 'string', description: 'Descripción del módulo' },
					url: { type: 'string', description: 'Url o ruta del módulo' },
					icon: { type: 'string', description: 'Icono del módulo' },
					type: { type: 'string', enum: ['item', 'collapse'], description: 'Tipo del módulo' },
					submodulos: {
						type: 'array',
						description: 'Submódulos del módulo',
						items: {
							type: 'object',
							properties: {
								orden: { type: 'integer', description: 'Orden del submódulo' },
								tag: { type: 'string', description: 'Tag o etiqueta del submódulo' },
								nombre: { type: 'string', description: 'Nombre del módulo' },
								descripcion: { type: 'string', description: 'Descripción del submódulo' },
								url: { type: 'string', description: 'Url o ruta del módulo' },
								type: { type: 'string', enum: ['item', 'collapse'], description: 'Tipo del submódulo' },
								estado: { type: 'boolean', description: 'Estado del submódulo' }
							}
						}
					},
					estado: { type: 'boolean', description: 'Estado del módulo' }
				},
				required: ['orden', 'tag', 'nombre', 'type']
			},
			ModuloResponse: {
				type: 'object',
				properties: {
					_id: { type: 'string', description: 'Id del módulo' },
					orden: { type: 'integer', description: 'Orden del módulo' },
					tag: { type: 'string', description: 'Tag o etiqueta del módulo' },
					nombre: { type: 'string', description: 'Nombre del módulo' },
					descripcion: { type: 'string', description: 'Descripción del módulo' },
					url: { type: 'string', description: 'Url o ruta del módulo' },
					icon: { type: 'string', description: 'Icono del módulo' },
					type: { type: 'string', enum: ['item', 'collapse'], description: 'Tipo del módulo' },
					submodulos: {
						type: 'array',
						description: 'Submódulos del módulo',
						items: {
							type: 'object',
							properties: {
								_id: { type: 'string', description: 'Id del submódulo' },
								orden: { type: 'integer', description: 'Orden del submódulo' },
								tag: { type: 'string', description: 'Tag o etiqueta del submódulo' },
								nombre: { type: 'string', description: 'Nombre del submódulo' },
								descripcion: { type: 'string', description: 'Descripción del submódulo' },
								url: { type: 'string', description: 'Url o ruta del submódulo' },
								type: { type: 'string', enum: ['item', 'collapse'], description: 'Tipo del submódulo' },
								estado: { type: 'boolean', description: 'Estado del submódulo' }
							}
						}
					},
					estado: { type: 'boolean', description: 'Estado del módulo' }
				}
			},
			RolRequest: {
				type: 'object',
				properties: {
					nombre: { type: 'string', description: 'Nombre del rol' },
					descripcion: { type: 'string', description: 'Descripción del rol' },
					permisos: {
						type: 'array',
						description: 'Permisos de módulos del rol de usuario',
						items: {
							type: 'object',
							properties: {
								modulo: { type: 'string', description: 'Módulo permitido' },
								acciones: {
									type: 'array',
									description: 'acciones permitidas',
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
												description: 'acciones permitidas',
												items: { type: 'string' }
											}
										}
									}
								}
							}
						}
					},
					prioridad: {
						type: 'integer',
						description: 'Prioridad del rol'
					},
					estado: {
						type: 'boolean',
						description: 'Estado del rol'
					}
				},
				required: ['nombre', 'prioridad']
			},
			RolResponse: {
				type: 'object',
				properties: {
					_id: { type: 'string', description: 'Id del rol' },
					nombre: { type: 'string', description: 'Nombre del rol' },
					descripcion: { type: 'string', description: 'Descripción del rol' },
					permisos: {
						type: 'array',
						description: 'Permisos de módulos del rol de usuario',
						items: {
							type: 'object',
							properties: {
								_id: { type: 'string', description: 'Id del permiso de módulo' },
								modulo: { type: 'string', description: 'Módulo permitido' },
								acciones: {
									type: 'array',
									description: 'acciones permitidas',
									items: { type: 'string' }
								},
								permisos: {
									type: 'array',
									description: 'Permisos de submódulos del módulo del rol de usuario',
									items: {
										type: 'object',
										properties: {
											_id: { type: 'string', description: 'Id del permiso de submódulo' },
											submodulo: { type: 'string', description: 'Submódulo permitido' },
											acciones: {
												type: 'array',
												description: 'acciones permitidas',
												items: { type: 'string' }
											}
										}
									}
								}
							}
						}
					},
					prioridad: {
						type: 'integer',
						description: 'Prioridad del rol'
					},
					estado: {
						type: 'boolean',
						description: 'Estado del rol'
					}
				}
			},
			UsuarioRequest: {
				type: 'object',
				properties: {
					nombres: { type: 'string', description: 'Nombres del usuario', default: 'Carlos' },
					apellido_paterno: {
						type: 'string',
						description: 'Apellido paterno del usuario',
						default: 'Santander'
					},
					apellido_materno: { type: 'string', description: 'Apellido materno del usuario', default: 'Ruiz' },
					email: { type: 'string', description: 'Email del usuario', default: 'correo@gmail.com' },
					dni: { type: 'string', description: 'DNI del usuario', default: '19283746' },
					genero: { type: 'string', description: 'Género del usuario', default: 'M' },
					password: { type: 'string', description: 'Clave del usuario', default: 'secret' },
					rol: { type: 'string', description: 'ID del rol de usuario', default: '60e00fc129bc965cf8eb76cc' },
					file: {
						type: 'string',
						format: 'binary',
						description: 'Archivo de imagen o avatar del usuario'
					},
					estado: { type: 'boolean', description: 'Estado del usuario', default: true }
				},
				required: [
					'nombres',
					'apellido_paterno',
					'apellido_materno',
					'email',
					'dni',
					'genero',
					'password',
					'rol'
				]
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
					},
					estado: { type: 'boolean', description: 'Estado del usuario' }
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
