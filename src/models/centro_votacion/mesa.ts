/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document, PopulatedDoc } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import validator from 'validator'
import { IDepartamento } from '../ubigeo/departamento'
import { IProvincia } from '../ubigeo/provincia'
import { IDistrito } from '../ubigeo/distrito'
import { IPersonero } from './personero'

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface IMesa extends Document {
  ubigeo: string
  departamento?: PopulatedDoc<IDepartamento>
  provincia?: PopulatedDoc<IProvincia>
  distrito?: PopulatedDoc<IDistrito>
  local: string
  mesa: string
  personero_provincia?: PopulatedDoc<IPersonero>
  personero_distrito?: PopulatedDoc<IPersonero>
  personero_local?: PopulatedDoc<IPersonero>
  personero_mesa?: PopulatedDoc<IPersonero>
  votantes?: number
  anho: number
  createdAt: Date
  updatedAt: Date
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const MesaSchema: Schema = new Schema(
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
    local: {
      type: String,
      required: [true, 'El local de votación es requerido'],
      trim: true
    },
    mesa: {
      type: String,
      required: [true, 'El número de mesa es requerido'],
      validate: {
        validator: validator.isNumeric,
        message: 'El número de mesa debe tener sólo números'
      },
      minLength: [6, 'El número de mesa debe tener 6 digitos'],
      maxLength: [6, 'El número de mesa debe tener 6 digitos']
    },
    personero_provincia: {
      ref: 'CentroVotacionPersonero',
      type: Schema.Types.ObjectId
    },
    personero_distrito: {
      ref: 'CentroVotacionPersonero',
      type: Schema.Types.ObjectId
    },
    personero_local: {
      ref: 'CentroVotacionPersonero',
      type: Schema.Types.ObjectId
    },
    personero_mesa: {
      ref: 'CentroVotacionPersonero',
      type: Schema.Types.ObjectId
    },
    votantes: Number,
    anho: Number
  },
  {
    collection: 'centros_votacion.mesas',
    timestamps: true,
    versionKey: false
  }
)

/*******************************************************************************************************/
// Validamos los campos que son únicos, con mensaje personalizado //
/*******************************************************************************************************/
MesaSchema.plugin(uniqueValidator, {
  message: '{VALUE}, ya se encuentra registrado'
})

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<IMesa>('CentroVotacionMesa', MesaSchema)
