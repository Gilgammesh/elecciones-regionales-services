/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document, PopulatedDoc } from 'mongoose';
import { IUsuario } from '../usuarios/usuario';

/*******************************************************************************************************/
// Interface de Eventos de Logs //
/*******************************************************************************************************/
interface IEventsLogs {
	create: string;
	update: string;
	remove: string;
}

/*******************************************************************************************************/
// Eventos de Logs //
/*******************************************************************************************************/
export const eventsLogs: IEventsLogs = {
	create: 'crear',
	update: 'actualizar',
	remove: 'remover'
};

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface ILog extends Document {
	usuario: PopulatedDoc<IUsuario>;
	fuente: string;
	origen: string;
	ip: string;
	dispositivo: string;
	navegador: string;
	modulo: string;
	submodulo: string;
	controller: string;
	funcion: string;
	descripcion?: string;
	evento: string;
	data_in?: string;
	data_out?: string;
	procesamiento: string;
	registros: number;
	id_grupo: string;
	createdAt: Date;
	updatedAt: Date;
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const LogSchema: Schema = new Schema(
	{
		usuario: {
			ref: 'Usuario',
			type: Schema.Types.ObjectId,
			required: [true, 'El usuario es requerido']
		},
		fuente: {
			type: String,
			enum: {
				values: ['intranet', 'app'],
				message: '{VALUE}, no es una fuente válida. Elija entre: intranet | app'
			},
			required: [true, 'La fuente es requerida']
		},
		origen: {
			type: String,
			required: [true, 'El origen es requerido']
		},
		ip: {
			type: String,
			required: [true, 'El ip es requerido']
		},
		dispositivo: {
			type: String,
			required: [true, 'El dispositivo es requerido']
		},
		navegador: {
			type: String,
			required: [true, 'El navegador es requerido']
		},
		modulo: {
			type: String,
			required: [true, 'El módulo es requerido']
		},
		submodulo: String,
		controller: {
			type: String,
			required: [true, 'El controlador es requerido']
		},
		funcion: {
			type: String,
			required: [true, 'La función es requerida']
		},
		descripcion: String,
		evento: {
			type: String,
			enum: {
				values: ['crear', 'actualizar', 'remover'],
				message: '{VALUE}, no es un evento válido. Elija entre: crear | actualizar | remover'
			},
			required: [true, 'El evento es requerido']
		},
		data_in: String,
		data_out: String,
		procesamiento: {
			type: String,
			enum: {
				values: ['unico', 'masivo'],
				message: '{VALUE}, no es un procesamiento válido. Elija entre: unico | masivo'
			},
			required: [true, 'El procesamiento es requerido']
		},
		registros: {
			type: Number,
			default: 1,
			required: [true, 'La cantidad de registros es requerida']
		},
		id_grupo: String
	},
	{
		collection: 'admin.logs',
		timestamps: true,
		versionKey: false
	}
);

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<ILog>('AdminLog', LogSchema);
