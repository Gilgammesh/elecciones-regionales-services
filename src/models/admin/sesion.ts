/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document, PopulatedDoc } from 'mongoose'
import { IUsuario } from '../usuario'

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface ISesion extends Document {
  usuario: PopulatedDoc<IUsuario>
  fuente: string
  ip: string
  dispositivo: string
  navegador: string
  estado: string
  createdAt: Date
  updatedAt: Date
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const SesionSchema: Schema = new Schema(
  {
    usuario: {
      ref: 'Usuario',
      type: Schema.Types.ObjectId,
      required: [true, 'El id del usuario es requerido']
    },
    fuente: {
      type: String,
      enum: {
        values: ['intranet', 'app'],
        message: '{VALUE}, no es una fuente válido. Elija entre: intranet | app'
      },
      required: [true, 'La fuente es requerida']
    },
    ip: {
      type: String,
      required: [true, 'El ip es requerido']
    },
    dispositivo: {
      type: String,
      required: [true, 'El dispositivo es requerido']
    },
    navegador: {
      type: String,
      required: [true, 'El navegador es requerido']
    },
    estado: {
      type: String,
      enum: {
        values: ['online', 'busy', 'offline'],
        message: '{VALUE}, no es un estado válido. Elija entre: online | busy | offline'
      },
      default: 'online',
      required: [true, 'El estado es requerido']
    }
  },
  {
    collection: 'admin.sesiones',
    timestamps: true,
    versionKey: false
  }
)

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<ISesion>('AdminSesion', SesionSchema)
