/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface IAccion extends Document {
	nombre: string;
	descripcion?: string;
	createdAt: Date;
	updatedAt: Date;
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const AccionSchema: Schema = new Schema(
	{
		nombre: {
			type: String,
			unique: true,
			required: [true, 'El nombre es requerido'],
			trim: true
		},
		descripcion: String
	},
	{
		collection: 'admin.acciones',
		timestamps: true,
		versionKey: false
	}
);

/*******************************************************************************************************/
// Validamos los campos que son únicos, con mensaje personalizado //
/*******************************************************************************************************/
AccionSchema.plugin(uniqueValidator, { message: '{VALUE}, ya se encuentra registrado' });

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<IAccion>('AdminAccion', AccionSchema);
