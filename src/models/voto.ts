/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document, PopulatedDoc } from 'mongoose'
import { IMesa } from './centro_votacion/mesa'
import { IOrganizacion } from './organizacion_politica/organizacion'
import { IDepartamento } from './ubigeo/departamento'
import { IProvincia } from './ubigeo/provincia'
import { IDistrito } from './ubigeo/distrito'

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface IVoto extends Document {
  mesa: PopulatedDoc<IMesa>
  tipo: string
  organizacion?: PopulatedDoc<IOrganizacion>
  departamento: PopulatedDoc<IDepartamento>
  provincia: PopulatedDoc<IProvincia>
  distrito: PopulatedDoc<IDistrito>
  anho: number
  votos_gober: number
  votos_conse: number
  votos_alc_prov: number
  votos_alc_dist: number
  createdAt: Date
  updatedAt: Date
}
export enum ETipoVoto {
  Partido = 'partido',
  Nulo = 'nulo',
  Blanco = 'blanco',
  Impugnado = 'impugnado'
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const VotoSchema: Schema = new Schema(
  {
    mesa: {
      ref: 'CentroVotacionMesa',
      type: Schema.Types.ObjectId,
      required: [true, 'La mesa es requerida']
    },
    tipo: {
      type: String,
      enum: {
        values: ['partido', 'nulo', 'blanco', 'impugnado']
      },
      required: [true, 'El tipo de voto es requerido']
    },
    organizacion: {
      ref: 'OrganizacionPolitica',
      type: Schema.Types.ObjectId
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
    anho: Number,
    votos_gober: Number,
    votos_conse: Number,
    votos_alc_prov: Number,
    votos_alc_dist: Number
  },
  {
    collection: 'votos',
    timestamps: true,
    versionKey: false
  }
)

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<IVoto>('Voto', VotoSchema)
