/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document, PopulatedDoc } from 'mongoose'
import validator from 'validator'
import { IDepartamento } from '../ubigeo/departamento'
import { IOrganizacion } from './organizacion'

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface IGobernador extends Document {
  nombres: string
  apellidos: string
  dni: string
  foto: string
  departamento: PopulatedDoc<IDepartamento>
  organizacion: PopulatedDoc<IOrganizacion>
  estado: boolean
  createdAt: Date
  updatedAt: Date
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const GobernadorSchema: Schema = new Schema(
  {
    nombres: {
      type: String,
      required: [true, 'Los nombres son requeridos'],
      trim: true
    },
    apellidos: {
      type: String,
      required: [true, 'Los apellidos son requeridos'],
      trim: true
    },
    dni: {
      type: String,
      required: [true, 'El DNI es requerido y obligatorio'],
      validate: {
        validator: validator.isNumeric,
        message: 'El DNI debe tener sólo números'
      },
      minLength: [8, 'El DNI debe tener 8 digitos'],
      maxLength: [8, 'El DNI debe tener 8 digitos']
    },
    foto: {
      type: String,
      required: [true, 'La foto es requerida']
    },
    departamento: {
      ref: 'UbigeoDepartamento',
      type: Schema.Types.ObjectId,
      required: [true, 'El departamento es requerido']
    },
    organizacion: {
      ref: 'OrganizacionPolitica',
      type: Schema.Types.ObjectId,
      required: [true, 'La organizacion es requerida']
    },
    estado: {
      type: Boolean,
      default: true,
      required: true
    }
  },
  {
    collection: 'organizaciones_politicas.gobernadores',
    timestamps: true,
    versionKey: false
  }
)

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<IGobernador>('OrganizacionPoliticaGobernador', GobernadorSchema)
