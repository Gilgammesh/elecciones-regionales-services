/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document, PopulatedDoc } from 'mongoose'
import { IUsuario } from '../usuario'
import { IPersonero } from '../centro_votacion/personero'

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
export interface ISesion extends Document {
  usuario?: PopulatedDoc<IUsuario>
  personero?: PopulatedDoc<IPersonero>
  socketId: string
  fuente: string
  ip?: string
  dispositivo: string
  navegador?: string
  plataforma?: string
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
      type: Schema.Types.ObjectId
    },
    personero: {
      ref: 'CentroVotacionPersonero',
      type: Schema.Types.ObjectId
    },
    socketId: {
      type: String,
      required: [true, 'El socket id es requerido']
    },
    fuente: {
      type: String,
      enum: {
        values: ['intranet', 'app'],
        message: '{VALUE}, no es una fuente válido. Elija entre: intranet | app'
      },
      required: [true, 'La fuente es requerida']
    },
    ip: String,
    dispositivo: String,
    navegador: String,
    plataforma: String,
    estado: {
      type: String,
      enum: {
        values: ['online', 'busy', 'offline'],
        message: '{VALUE}, no es un estado válido. Elija entre: online | busy | offline'
      },
      default: 'online'
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
