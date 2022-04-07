/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface IPermisosSubmodulo {
	submodulo: string;
	acciones: string[];
}
export interface IPermisosModulo {
	modulo: string;
	acciones: string[];
	permisos: Array<IPermisosSubmodulo>;
}
export interface IRol extends Document {
	codigo: number;
	nombre: string;
	descripcion?: string;
	permisos: Array<IPermisosModulo>;
	prioridad: number;
	super: boolean;
	estado: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const RolSchema: Schema = new Schema(
	{
		codigo: {
			type: Number,
			unique: true,
			required: [true, 'El código es requerido']
		},
		nombre: {
			type: String,
			unique: true,
			required: [true, 'El nombre es requerido'],
			trim: true
		},
		descripcion: String,
		permisos: [
			{
				modulo: String,
				acciones: [String],
				permisos: [
					{
						submodulo: String,
						acciones: [String]
					}
				]
			}
		],
		prioridad: {
			type: Number,
			default: 1,
			required: true
		},
		super: {
			type: Boolean,
			default: false,
			required: true
		},
		estado: {
			type: Boolean,
			default: true,
			required: true
		}
	},
	{
		collection: 'admin.roles',
		timestamps: true,
		versionKey: false
	}
);

/*******************************************************************************************************/
// Validamos los campos que son únicos, con mensaje personalizado //
/*******************************************************************************************************/
RolSchema.plugin(uniqueValidator, { message: '{VALUE}, ya se encuentra registrado' });

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<IRol>('AdminRol', RolSchema);
