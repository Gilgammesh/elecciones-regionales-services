/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document, PopulatedDoc } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import validator from 'validator';
import { IRol } from './admin/rol';
import { IDepartamento } from './ubigeo/departamento';

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface IUsuario extends Document {
	nombres: string;
	apellidos: string;
	dni: string;
	celular?: string;
	email?: string;
	genero: string;
	password: string;
	img?: string;
	rol: PopulatedDoc<IRol>;
	departamento?: PopulatedDoc<IDepartamento>;
	anho?: number;
	super: boolean;
	estado: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const UsuarioSchema: Schema = new Schema(
	{
		nombres: {
			type: String,
			required: [true, 'Los nombres son requeridos'],
			trim: true,
			validate: {
				validator: value => validator.isAlpha(value, 'es-ES', { ignore: 's' }),
				message: 'Los nombres deben tener sólo letras'
			}
		},
		apellidos: {
			type: String,
			required: [true, 'Los apellidos son requeridos'],
			trim: true,
			validate: {
				validator: value => validator.isAlpha(value, 'es-ES', { ignore: 's' }),
				message: 'Los apellidos deben tener sólo letras'
			}
		},
		dni: {
			type: String,
			unique: true,
			required: [true, 'El DNI es requerido y obligatorio'],
			validate: {
				validator: validator.isNumeric,
				message: 'El DNI debe tener sólo números'
			},
			minLength: [8, 'El DNI debe tener 8 digitos'],
			maxLength: [8, 'El DNI debe tener 8 digitos']
		},
		celular: String,
		email: String,
		genero: {
			type: String,
			enum: { values: ['M', 'F'], message: '{VALUE}, no es un género válido. Elija entre: M | F' },
			required: [true, 'El género es requerido']
		},
		password: {
			type: String,
			required: [true, 'La contraseña es requerida'],
			minlength: [6, 'La contraseña debe tener mínimo 6 dígitos']
		},
		img: String,
		rol: {
			ref: 'AdminRol',
			type: Schema.Types.ObjectId,
			required: [true, 'El id del rol del usuario es requerido']
		},
		departamento: {
			ref: 'UbigeoDepartamento',
			type: Schema.Types.ObjectId
		},
		anho: Number,
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
		collection: 'usuarios',
		timestamps: true,
		versionKey: false
	}
);

/*******************************************************************************************************/
// Validamos los campos que son únicos, con mensaje personalizado //
/*******************************************************************************************************/
UsuarioSchema.plugin(uniqueValidator, { message: '{VALUE}, ya se encuentra registrado' });

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<IUsuario>('Usuario', UsuarioSchema);
