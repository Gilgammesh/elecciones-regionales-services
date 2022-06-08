/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import { Schema, model, Document } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

/*******************************************************************************************************/
// Interface del Modelo //
/*******************************************************************************************************/
interface IChildren {
  orden: number
  tag: string
  nombre: string
  descripcion?: string
  type: string
  url?: string
  estado: boolean
}
export interface IModulo extends Document {
  orden: number
  tag: string
  nombre: string
  descripcion?: string
  type: string
  url?: string
  icon?: string
  children: Array<IChildren>
  estado: boolean
  createdAt: Date
  updatedAt: Date
}

/*******************************************************************************************************/
// Creamos el schema y definimos los nombres y tipos de datos //
/*******************************************************************************************************/
const ModuloSchema: Schema = new Schema(
  {
    orden: {
      type: Number,
      unique: true,
      required: [true, 'El orden es requerido']
    },
    tag: {
      type: String,
      unique: true,
      required: [true, 'La etiqueta es requerida']
    },
    nombre: {
      type: String,
      unique: true,
      required: [true, 'El nombre es requerido']
    },
    descripcion: String,
    type: {
      type: String,
      enum: ['item', 'collapse'],
      required: [true, 'El tipo es requerido']
    },
    url: String,
    icon: {
      type: String,
      default: 'adjust'
    },
    children: [
      {
        orden: {
          type: Number,
          required: [true, 'El orden es requerido']
        },
        tag: {
          type: String,
          required: [true, 'La etiqueta es requerida']
        },
        nombre: {
          type: String,
          required: [true, 'El nombre es requerido']
        },
        descripcion: String,
        type: {
          type: String,
          required: [true, 'El tipo es requerido']
        },
        url: String,
        estado: {
          type: Boolean,
          default: true
        }
      }
    ],
    estado: {
      type: Boolean,
      default: true
    }
  },
  {
    collection: 'admin.modulos',
    timestamps: true,
    versionKey: false
  }
)

/*******************************************************************************************************/
// Validamos los campos que son únicos, con mensaje personalizado //
/*******************************************************************************************************/
ModuloSchema.plugin(uniqueValidator, {
  message: '{VALUE}, ya se encuentra registrado'
})

/*******************************************************************************************************/
// Exportamos el modelo de datos //
/*******************************************************************************************************/
export default model<IModulo>('AdminModulo', ModuloSchema)
