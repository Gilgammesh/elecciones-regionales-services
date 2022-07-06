declare namespace Express {
  interface Request {
    usuario: {
      _id: string
      rol: {
        _id: string
        super: boolean
      }
      departamento?: {
        _id: string
        codigo: string
      }
      anho?: number
    }
    personero: {
      _id: string
      departamento?: {
        _id: string
        codigo: string
      }
      anho?: number
    }
  }
}
