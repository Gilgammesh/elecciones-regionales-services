/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
const moment = require('moment-timezone')
import { Moment } from 'moment-timezone'
import { timeZone } from '../configs'
import { capitalizar } from './text'

/*******************************************************************************************************/
// Función para obtener la Fecha Actual parseada ("dd/mm/yyyy") como un string //
/*******************************************************************************************************/
export const parseNewDate = () => {
  // Obtenemos la fecha actual
  const date = new Date()

  // Obtenemos el día, mes y año
  const day: number = date.getDate()
  const month: number = date.getMonth() + 1
  const year: number = date.getFullYear()

  // Casteamos a string con dos dígitos
  let day_: string = day < 10 ? `0${day}` : `${day}`
  let month_: string = month < 10 ? `0${month}` : `${month}`

  // Definimos la variable
  const dateString: string = `${day_}/${month_}/${year}`

  // Retornamos
  return dateString
}

/*******************************************************************************************************/
// Función para obtener la Fecha Actual parseada 24 Horas ("dd/mm/yyyy HH:mm:ss") como un string //
/*******************************************************************************************************/
export const parseNewDate24H = () => {
  // Obtenemos la fecha actual
  const date = new Date()

  // Obtenemos el día, mes y año
  const day: number = date.getDate()
  const month: number = date.getMonth() + 1
  const year: number = date.getFullYear()
  const hour: number = date.getHours()
  const minute: number = date.getMinutes()
  const second: number = date.getSeconds()

  // Casteamos a string con dos dígitos
  let day_: string = day < 10 ? `0${day}` : `${day}`
  let month_: string = month < 10 ? `0${month}` : `${month}`
  let hour_: string = hour < 10 ? `0${hour}` : `${hour}`
  let minute_: string = minute < 10 ? `0${minute}` : `${minute}`
  let second_: string = second < 10 ? `0${second}` : `${second}`

  // Definimos la variable
  const dateString: string = `${day_}/${month_}/${year} ${hour_}:${minute_}:${second_}`

  // Retornamos
  return dateString
}

/*******************************************************************************************************/
// Función para obtener la Fecha Actual parseada 24 Horas ("yyyy-mm-ddTHH:mm:ss.msZ") como un string //
/*******************************************************************************************************/
export const parseNewDate24H_ = () => {
  // Obtenemos la fecha actual
  const date = new Date()

  // Obtenemos el día, mes y año
  const day: number = date.getDate()
  const month: number = date.getMonth() + 1
  const year: number = date.getFullYear()
  const hour: number = date.getHours()
  const minute: number = date.getMinutes()
  const second: number = date.getSeconds()
  const milisecond: number = date.getMilliseconds()

  // Casteamos a string con dos dígitos
  let day_: string = day < 10 ? `0${day}` : `${day}`
  let month_: string = month < 10 ? `0${month}` : `${month}`
  let hour_: string = hour < 10 ? `0${hour}` : `${hour}`
  let minute_: string = minute < 10 ? `0${minute}` : `${minute}`
  let second_: string = second < 10 ? `0${second}` : `${second}`
  let milisecond_: string = ''
  if (milisecond < 10) {
    milisecond_ = `00${milisecond}`
  }
  if (milisecond >= 10 && milisecond < 100) {
    milisecond_ = `0${milisecond}`
  }
  if (milisecond >= 100) {
    milisecond_ = `${milisecond}`
  }

  // Definimos la variable
  const dateString: string = `${year}-${month_}-${day_}T${hour_}:${minute_}:${second_}.${milisecond_}Z`

  // Retornamos
  return dateString
}

/*******************************************************************************************************/
// Función para obtener la Fecha Actual parseada 12 Horas ("dd/mm/yyyy hh:mm:ss a") como un string //
/*******************************************************************************************************/
export const parseNewDate12H = () => {
  // Obtenemos la fecha actual
  const date = new Date()

  // Obtenemos el día, mes y año
  const day: number = date.getDate()
  const month: number = date.getMonth() + 1
  const year: number = date.getFullYear()
  const hour: number = date.getHours()
  const minute: number = date.getMinutes()
  const second: number = date.getSeconds()
  let ampm: string = ''
  if (hour < 12) {
    ampm = 'am'
  }
  if (hour === 12) {
    ampm = 'm'
  }
  if (hour > 12) {
    ampm = 'pm'
  }
  // Casteamos a string con dos dígitos
  let day_: string = day < 10 ? `0${day}` : `${day}`
  let month_: string = month < 10 ? `0${month}` : `${month}`
  let hour_: number = hour === 0 || hour === 12 ? 12 : hour % 12
  let hour__: string = hour_ < 10 ? `0${hour_}` : `${hour_}`
  let minute_: string = minute < 10 ? `0${minute}` : `${minute}`
  let second_: string = second < 10 ? `0${second}` : `${second}`

  // Definimos la variable
  const dateString: string = `${day_}/${month_}/${year} ${hour__}:${minute_}:${second_} ${ampm}`

  // Retornamos
  return dateString
}

/*******************************************************************************************************/
// Función para obtener el mensaje de la Fecha parseada del Token como un string //
/*******************************************************************************************************/
export const parseJwtDateExpire = (date: Date) => {
  // Casteamos la fecha
  const fecha: Moment = moment(date).tz(timeZone)
  const dayNro: string = fecha.format('DD')
  const monthName: string = fecha.format('MMMM')
  const year: string = fecha.format('YYYY')
  const fecha_: string = `${dayNro} de ${monthName} de ${year}`
  const hora: string = fecha.format('hh:mm:ss a')
  const fechaExpire: string = `El token proporcionado ha expirado el ${fecha_} a las ${hora}`
  // Retornamos
  return fechaExpire
}

/*******************************************************************************************************/
// Función para obtener la Fecha Actual parseada ("dd/mm/yyyy") como un string //
/*******************************************************************************************************/
export const parseMomentDate = (date: Date) => {
  // Casteamos la fecha
  const fecha: Moment = moment(date).tz(timeZone)
  const day: string = fecha.format('DD')
  const month: string = fecha.format('MM')
  const year: string = fecha.format('YYYY')
  const fechaString: string = `${day}/${month}/${year}}`
  // Retornamos
  return fechaString
}

/*******************************************************************************************************/
// Función para obtener la Fecha Actual parseada 24 Horas ("dd/mm/yyyy HH:mm:ss") como un string //
/*******************************************************************************************************/
export const parseMomentDate24H = (date: Date) => {
  // Casteamos la fecha
  const fecha: Moment = moment(date).tz(timeZone)
  const day: string = fecha.format('DD')
  const month: string = fecha.format('MM')
  const year: string = fecha.format('YYYY')
  const hora: string = fecha.format('HH:mm:ss')
  const fechaString: string = `${day}/${month}/${year} ${hora}`
  // Retornamos
  return fechaString
}

/*******************************************************************************************************/
// Función para obtener la Fecha Actual parseada 12 Horas ("dd/mm/yyyy hh:mm:ss a") como un string //
/*******************************************************************************************************/
export const parseMomentDate12H = (date: Date) => {
  // Casteamos la fecha
  const fecha = moment(date).tz(timeZone)
  const day: string = fecha.format('DD')
  const month: string = fecha.format('MM')
  const year: string = fecha.format('YYYY')
  const hora: string = fecha.format('hh:mm:ss a')
  const fechaString: string = `${day}/${month}/${year} ${hora}`
  // Retornamos
  return fechaString
}

/*******************************************************************************************************/
// Función para obtener la Fecha Actual parseada 12 Horas ("dddd dd/mm/yyyy hh:mm:ss a") como un string //
/*******************************************************************************************************/
export const parseMomentDate12HDay = (date: Date) => {
  // Casteamos la fecha
  const fecha = moment(date).tz(timeZone)
  const dayName = capitalizar(fecha.format('dddd'))
  const day: string = fecha.format('DD')
  const month: string = fecha.format('MM')
  const year: string = fecha.format('YYYY')
  const hora: string = fecha.format('hh:mm:ss a')
  const fechaString: string = `${dayName} ${day}/${month}/${year} ${hora}`
  // Retornamos
  return fechaString
}

/*******************************************************************************************************/
// Función para obtener la Fecha Actual parseada 12 Horas ("dddd dd/mm/yyyy hh:mm:ss a") como un string //
/*******************************************************************************************************/
export const addDaysDate = (date: Date, days: number, format: string) => {
  // Casteamos la fecha y sumamos los días
  const fecha = moment(date).tz(timeZone).add(days, 'days')
  // Obtenemos el día, mes y año
  const day: string = fecha.format('DD')
  const month: string = fecha.format('MM')
  const year: string = fecha.format('YYYY')

  // Fecha de retorno
  let fechaString: string
  if (format.toLowerCase() === 'dd-mm-yyyy') {
    fechaString = `${day}-${month}-${year}`
  } else if (format.toLowerCase() === 'dd/mm/yyyy') {
    fechaString = `${day}/${month}/${year}`
  } else if (format.toLowerCase() === 'dd.mm.yyyy') {
    fechaString = `${day}.${month}.${year}`
  } else {
    fechaString = `${day}/${month}/${year}`
  }
  // Retornamos
  return fechaString
}
