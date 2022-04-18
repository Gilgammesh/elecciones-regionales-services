/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document, PopulatedDoc } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import validator from 'validator';
import { IDepartamento } from './ubigeo/departamento';
import { IProvincia } from './ubigeo/provincia';
import { IDistrito } from './ubigeo/distrito';

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface ICentroVotacion extends Document {
	ubigeo: string;
	departamento?: PopulatedDoc<IDepartamento>;
	provincia?: PopulatedDoc<IProvincia>;
	distrito?: PopulatedDoc<IDistrito>;
	nombre: string;
	mesa: string;
	votantes?: number;
	anho: number;
	createdAt: Date;
	updatedAt: Date;
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const CentroVotacionSchema: Schema = new Schema(
	{
		ubigeo: {
			type: String,
			required: [true, 'El ubigeo es requerido'],
			validate: {
				validator: validator.isNumeric,
				message: 'El ubigeo debe tener sólo números'
			},
			minLength: [6, 'El ubigeo debe tener 6 digitos'],
			maxLength: [6, 'El ubigeo debe tener 6 digitos']
		},
		departamento: {
			ref: 'UbigeoDepartamento',
			type: Schema.Types.ObjectId,
			required: [true, 'El departamento es requerido']
		},
		provincia: {
			ref: 'UbigeoProvincia',
			type: Schema.Types.ObjectId,
			required: [true, 'La provincia es requerido']
		},
		distrito: {
			ref: 'UbigeoDistrito',
			type: Schema.Types.ObjectId,
			required: [true, 'El distrito es requerido']
		},
		nombre: {
			type: String,
			required: [true, 'El nombre del centro de votación es requerido'],
			trim: true
		},
		mesa: {
			type: String,
			unique: true,
			required: [true, 'El número de mesa es requerido y obligatorio'],
			validate: {
				validator: validator.isNumeric,
				message: 'El DNI debe tener sólo números'
			},
			minLength: [6, 'El número de mesa debe tener 6 digitos'],
			maxLength: [6, 'El número de mesa debe tener 6 digitos']
		},
		votantes: Number,
		anho: Number
	},
	{
		collection: 'centros_votacion',
		timestamps: true,
		versionKey: false
	}
);

/*******************************************************************************************************/
// Validamos los campos que son únicos, con mensaje personalizado //
/*******************************************************************************************************/
CentroVotacionSchema.plugin(uniqueValidator, { message: '{VALUE}, ya se encuentra registrado' });

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<ICentroVotacion>('CentroVotacion', CentroVotacionSchema);
