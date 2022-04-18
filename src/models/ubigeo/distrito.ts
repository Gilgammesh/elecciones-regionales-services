/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import validator from 'validator';

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface IDistrito extends Document {
	ubigeo: string;
	codigo: string;
	nombre: string;
	provincia: string;
	departamento: string;
	createdAt: Date;
	updatedAt: Date;
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const DistritoSchema: Schema = new Schema(
	{
		ubigeo: {
			type: String,
			unique: true,
			required: [true, 'El ubigeo es requerido'],
			validate: {
				validator: validator.isNumeric,
				message: 'El ubigeo debe tener sólo números'
			},
			minLength: [6, 'El ubigeo debe tener 6 digitos'],
			maxLength: [6, 'El ubigeo debe tener 6 digitos']
		},
		codigo: {
			type: String,
			required: [true, 'El código es requerido'],
			validate: {
				validator: validator.isNumeric,
				message: 'El código debe tener sólo números'
			},
			minLength: [2, 'El código debe tener 2 digitos'],
			maxLength: [2, 'El código debe tener 2 digitos']
		},
		nombre: {
			type: String,
			required: [true, 'El nombre es requerido'],
			trim: true
		},
		provincia: {
			type: String,
			required: [true, 'La provincia es requerida'],
			validate: {
				validator: validator.isNumeric,
				message: 'La provincia debe tener sólo números'
			},
			minLength: [2, 'La provincia debe tener 2 digitos'],
			maxLength: [2, 'La provincia debe tener 2 digitos']
		},
		departamento: {
			type: String,
			required: [true, 'El departamento es requerido'],
			validate: {
				validator: validator.isNumeric,
				message: 'El departamento debe tener sólo números'
			},
			minLength: [2, 'El departamento debe tener 2 digitos'],
			maxLength: [2, 'El departamento debe tener 2 digitos']
		}
	},
	{
		collection: 'ubigeo.distritos',
		timestamps: true,
		versionKey: false
	}
);

/*******************************************************************************************************/
// Validamos los campos que son únicos, con mensaje personalizado //
/*******************************************************************************************************/
DistritoSchema.plugin(uniqueValidator, { message: '{VALUE}, ya se encuentra registrado' });

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<IDistrito>('UbigeoDistrito', DistritoSchema);
