/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { SwaggerOptions } from 'swagger-ui-express';
import { appNombre, appDescripcion, appEnvironment, appAutorEmail, appAutorName, appAutorWeb } from '../configs';
import { getHost } from '../helpers/host';

/*******************************************************************************************************/
// Variables de las opciones //
/*******************************************************************************************************/
const basePath: string = '/efacturacion';
const schema: string = 'Facturación Electrónica';

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
			name: 'Importar Excel',
			description:
				'Ruta relacionada a importar una plantilla de excel del sistema de ventas actual (Scord Software)'
		},
		{
			name: 'Tipos de Comprobante',
			description: 'Rutas relacionadas a gestion los tipos de comprobante de la facturación electrónica'
		}
	],
	paths: {
		'/importar-excel': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			post: {
				tags: ['Importar Excel'],
				summary: 'Importar Excel a NUBEFACT',
				description:
					'Método para importar una plantilla de excel del sistema de ventas actual (Scord Software) y enviar los comprobantes a NUBEFACT',
				requestBody: {
					content: {
						'multipart/form-data': {
							schema: {
								type: 'object',
								properties: {
									file: {
										type: 'string',
										format: 'binary',
										nullable: true
									}
								},
								required: ['file']
							},
							encoding: {
								file: {
									contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Resumen de comprobantes enviados a NUBEFACT',
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
										resumen: {
											type: 'array',
											items: {
												$ref: '#/components/schemas/ResumenResponse'
											}
										}
									},
									example: {
										status: true,
										msg: 'Se actualizó el archivo de excel correctamente',
										resumen: [
											{
												tipo: 'BOLETA',
												serie: 'B001',
												numero: 46633,
												local: 'MOYOBAMBA',
												mensaje: 'Aceptado por NubeFact',
												estado: 'nuevo'
											},
											{
												tipo: 'BOLETA',
												serie: 'B001',
												numero: 46634,
												local: 'MOYOBAMBA',
												mensaje: 'Aceptado por NubeFact',
												estado: 'nuevo'
											},
											{
												tipo: 'FACTURA',
												serie: 'F001',
												numero: 739,
												local: 'MOYOBAMBA',
												mensaje: 'Aceptado por NubeFact',
												estado: 'nuevo'
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
									msg: 'No se pudo subir el archivo excel. Consulte con el administrador del Sistema!!'
								}
							}
						}
					}
				}
			}
		},
		'/tipos-comprobante': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' }
			],
			get: {
				tags: ['Tipos de Comprobante'],
				summary: 'Obtener lista de tipos de comprobante',
				description: 'Método para obtener lista de los tipos de comprobante de la facturación electrónica',
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
						description: 'Lista de tipos de comprobante',
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
												$ref: '#/components/schemas/TipoComprobanteResponse'
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
												codigo: 2,
												codigo_sunat: '03',
												nombre: 'BOLETA'
											},
											{
												_id: '60e00fc129bc965cf8eb76cd',
												codigo: 1,
												codigo_sunat: '01',
												nombre: 'FACTURA'
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
									msg: 'No se pudo obtener los tipos de comprobante'
								}
							}
						}
					}
				}
			},
			post: {
				tags: ['Tipos de Comprobante'],
				summary: 'Crear un nuevo tipo de comprobante',
				description: 'Método para crear un nuevo tipo de comprobante de la facturación electrónica',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/TipoComprobanteRequest'
							},
							examples: {
								tipo_comprobante: {
									summary: 'Un ejemplo de tipo de comprobante',
									value: {
										codigo: 1,
										codigo_sunat: '01',
										nombre: 'FACTURA'
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos del tipo de comprobante creado',
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
										tipo_comprobante: {
											type: 'object',
											$ref: '#/components/schemas/TipoComprobanteResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se creó el tipo de comprobante correctamente',
										tipo_comprobante: {
											_id: '60e00fc129bc965cf8eb76cd',
											codigo: 1,
											codigo_sunat: '01',
											nombre: 'FACTURA'
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
									msg: 'No se pudo crear el tipo de comprobante'
								}
							}
						}
					}
				}
			}
		},
		'/tipos-comprobante/{id}': {
			parameters: [
				{ $ref: '#/components/parameters/source' },
				{ $ref: '#/components/parameters/origin' },
				{ $ref: '#/components/parameters/ip' },
				{ $ref: '#/components/parameters/device' },
				{ $ref: '#/components/parameters/browser' },
				{
					in: 'path',
					name: 'id',
					description: 'ID del tipo de comprobante',
					required: true,
					schema: {
						type: 'string'
					}
				}
			],
			get: {
				tags: ['Tipos de Comprobante'],
				summary: 'Obtener datos de un tipo de comprobante',
				description: 'Método para obtener los datos de un tipo de comprobante de la facturación electrónica',
				responses: {
					'200': {
						description: 'Datos del tipo de comprobante consultado',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: {
											type: 'boolean'
										},
										tipo_comprobante: {
											type: 'object',
											$ref: '#/components/schemas/TipoComprobanteResponse'
										}
									},
									example: {
										status: true,
										tipo_comprobante: {
											_id: '60e00fc129bc965cf8eb76cd',
											codigo: 1,
											codigo_sunat: '01',
											nombre: 'FACTURA'
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
									msg: 'No se pudo obtener los datos del tipo de comprobante'
								}
							}
						}
					}
				}
			},
			put: {
				tags: ['Tipos de Comprobante'],
				summary: 'Actualizar datos de un tipo de comprobante',
				description: 'Método para actualizar los datos un tipo de comprobante de la facturación electrónica',
				parameters: [
					{
						in: 'path',
						name: 'id',
						description: 'ID del tipo de comprobante',
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
								$ref: '#/components/schemas/TipoComprobanteRequest'
							},
							examples: {
								tipo_comprobante: {
									summary: 'Un ejemplo de tipo de comprobante',
									value: {
										codigo: 1,
										codigo_sunat: '01',
										nombre: 'FACTURA'
									}
								}
							}
						}
					},
					required: true
				},
				responses: {
					'200': {
						description: 'Datos del tipo de comprobante actualizado',
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
										tipo_comprobante: {
											type: 'object',
											$ref: '#/components/schemas/TipoComprobanteResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se actualizó el tipo de comprobante correctamente',
										tipo_comprobante: {
											_id: '60e00fc129bc965cf8eb76cd',
											codigo: 1,
											codigo_sunat: '01',
											nombre: 'FACTURA'
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
									msg: 'No se pudo actualizar el tipo de comprobante'
								}
							}
						}
					}
				}
			},
			delete: {
				tags: ['Tipos de Comprobante'],
				summary: 'Eliminar un tipo de comprobante',
				description: 'Método para eliminar un tipo de comprobante de la facturación electrónica',
				parameters: [
					{
						in: 'path',
						name: 'id',
						description: 'ID del tipo de comprobante',
						required: true,
						schema: {
							type: 'string'
						}
					}
				],
				responses: {
					'200': {
						description: 'Datos del tipo de comprobante eliminado',
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
										tipo_comprobante: {
											type: 'object',
											$ref: '#/components/schemas/TipoComprobanteResponse'
										}
									},
									example: {
										status: true,
										msg: 'Se eliminó el tipo de comprobante correctamente',
										tipo_comprobante: {
											_id: '60e00fc129bc965cf8eb76cd',
											codigo: 3,
											codigo_sunat: '07',
											nombre: 'NOTA DE CRÉDITO'
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
									msg: 'No se pudo eliminar el tipo de comprobante'
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
			ResumenResponse: {
				type: 'object',
				properties: {
					tipo: { type: 'string', description: 'Nombre del tipo de comprobante' },
					serie: { type: 'string', description: 'Serie del comprobante' },
					numero: { type: 'integer', description: 'Número del comprobante' },
					local: { type: 'string', description: 'Nombre del Local donde se generó el comprobante' },
					mensaje: { type: 'string', description: 'Mensaje de respuesta el envío por parte de NUBEFACT' },
					estado: { type: 'string', description: 'Estado del comprobante (nuevo, existe, error)' }
				}
			},
			TipoComprobanteRequest: {
				type: 'object',
				properties: {
					codigo: { type: 'integer', description: 'Código del tipo de comprobante' },
					codigo_sunat: { type: 'string', description: 'Código SUNAT del tipo de comprobante' },
					nombre: { type: 'string', description: 'Nombre del tipo de comprobante' }
				},
				required: ['codigo', 'codigo_sunat', 'nombre']
			},
			TipoComprobanteResponse: {
				type: 'object',
				properties: {
					_id: { type: 'string', description: 'Id del tipo de comprobante' },
					codigo: { type: 'integer', description: 'Código del tipo de comprobante' },
					codigo_sunat: { type: 'string', description: 'Código SUNAT del tipo de comprobante' },
					nombre: { type: 'string', description: 'Nombre del tipo de comprobante' }
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
