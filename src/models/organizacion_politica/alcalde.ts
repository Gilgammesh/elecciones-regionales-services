/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document, PopulatedDoc } from 'mongoose'
import validator from 'validator'
import { IDepartamento } from '../ubigeo/departamento'
import { IProvincia } from '../ubigeo/provincia'
import { IDistrito } from '../ubigeo/distrito'
import { IOrganizacion } from './organizacion'

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface IAlcalde extends Document {
  nombres: string
  apellidos: string
  dni: string
  foto: string
  tipo: string
  departamento: PopulatedDoc<IDepartamento>
  provincia: PopulatedDoc<IProvincia>
  distrito?: PopulatedDoc<IDistrito>
  organizacion: PopulatedDoc<IOrganizacion>
  estado: boolean
  createdAt: Date
  updatedAt: Date
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const AlcaldeSchema: Schema = new Schema(
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
    foto: String,
    tipo: {
      type: String,
      enum: {
        values: ['provincial', 'distrital'],
        message: '{VALUE}, no es un tipo válido. Elija entre: provincial | distrital'
      },
      required: [true, 'El tipo es requerido']
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
      type: Schema.Types.ObjectId
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
    collection: 'organizaciones_politicas.alcaldes',
    timestamps: true,
    versionKey: false
  }
)

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<IAlcalde>('OrganizacionPoliticaAlcalde', AlcaldeSchema)
