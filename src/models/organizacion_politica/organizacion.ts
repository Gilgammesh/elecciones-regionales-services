/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document } from 'mongoose'

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface IOrganizacion extends Document {
  nombre: string
  siglas?: string
  logo: string
  anho: number
  estado: boolean
  createdAt: Date
  updatedAt: Date
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const OrganizacionSchema: Schema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true
    },
    siglas: String,
    logo: {
      type: String,
      required: [true, 'El logo es requerido']
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
    collection: 'organizaciones_politicas',
    timestamps: true,
    versionKey: false
  }
)

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<IOrganizacion>('OrganizacionPolitica', OrganizacionSchema)
