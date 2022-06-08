/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document, PopulatedDoc } from 'mongoose'
import validator from 'validator'
import { IDepartamento } from './ubigeo/departamento'

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface IPersonero extends Document {
  nombres: string
  apellidos: string
  dni: string
  celular: string
  tipo: string
  password: string
  departamento?: PopulatedDoc<IDepartamento>
  anho: number
  estado: boolean
  createdAt: Date
  updatedAt: Date
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const PersoneroSchema: Schema = new Schema(
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
      required: [true, 'El DNI es requerido'],
      validate: {
        validator: validator.isNumeric,
        message: 'El DNI debe tener sólo números'
      },
      minLength: [8, 'El DNI debe tener 8 digitos'],
      maxLength: [8, 'El DNI debe tener 8 digitos']
    },
    celular: {
      type: String,
      required: [true, 'El celular es requerido'],
      validate: {
        validator: validator.isNumeric,
        message: 'El celular debe tener sólo números'
      },
      minLength: [9, 'El celular debe tener 9 digitos'],
      maxLength: [9, 'El celular debe tener 9 digitos']
    },
    tipo: {
      type: String,
      required: [true, 'El tipo es requerido'],
      enum: {
        values: ['mesa', 'local', 'distrito', 'provincia'],
        message:
          '{VALUE}, no es un tipo válido. Elija entre: mesa | local | distrito | provincia'
      }
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [8, 'La contraseña debe tener mínimo 8 dígitos']
    },
    departamento: {
      required: [true, 'El departamento es requerido'],
      ref: 'UbigeoDepartamento',
      type: Schema.Types.ObjectId
    },
    anho: {
      type: Number,
      required: [true, 'El año es requerido']
    },
    estado: {
      type: Boolean,
      default: true,
      required: true
    }
  },
  {
    collection: 'personeros',
    timestamps: true,
    versionKey: false
  }
)

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<IPersonero>('Personero', PersoneroSchema)
