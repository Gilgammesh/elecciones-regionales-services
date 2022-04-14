/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document, PopulatedDoc } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import validator from 'validator';

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface IEleccion extends Document {
	anho: number;
	tipo: string;
	actual: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const EleccionSchema: Schema = new Schema(
	{
		anho: {
			type: Number,
			unique: true,
			required: [true, 'El año es requerido']
		},
		tipo: {
			type: String,
			enum: {
				values: ['regionales', 'generales'],
				message: '{VALUE}, no es un tipo de elecciones válido. Elija entre: regionales | generales'
			},
			required: [true, 'El tipo de elecciones es requerido']
		},
		actual: {
			type: Boolean,
			default: false,
			required: true
		}
	},
	{
		collection: 'elecciones',
		timestamps: true,
		versionKey: false
	}
);

/*******************************************************************************************************/
// Validamos los campos que son únicos, con mensaje personalizado //
/*******************************************************************************************************/
EleccionSchema.plugin(uniqueValidator, { message: '{VALUE}, ya se encuentra registrado' });

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<IEleccion>('Eleccion', EleccionSchema);
