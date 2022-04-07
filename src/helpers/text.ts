/*******************************************************************************************************/
// Función para capitalizar un texto //
/*******************************************************************************************************/
export const capitalizar = (text: string) => {
	// Tamaño del texto
	const size: number = text.length;
	// Convertimos todo a minúscula
	const text_: string = text.toLowerCase();
	// Parte mayúscula
	const textM: string = text_.substring(0, 1).trim().toUpperCase();
	// Parte minúscula
	const textm: string = text_.substring(1, size).trim();
	// Retornamos
	return `${textM}${textm}`;
};

/*******************************************************************************************************/
// Función para normalizar un texto //
/*******************************************************************************************************/
export const normalizar = (text: string) => {
	// Normalizamos de acuerdo a criterio
	const normTxt: string = text
		.toLowerCase() // Convertimos a minúsculas
		.normalize('NFD') // Forma de Normalización de Descomposición Canónica
		.replace(/[\u0300-\u0302]/g, '') // Removemos los acentos
		.trim(); // Quitamos los espacios
	// Retornamos
	return normTxt;
};

/*******************************************************************************************************/
// Función para quitar caracteres especiales para una ruta o nombre de archivo //
/*******************************************************************************************************/
export const normalizarPathFile = (text: string) => {
	// Normalizamos de acuerdo a criterio
	const normTxt: string = text
		.replace(/\\/g, '')
		.replace('/', '')
		.replace(':', '')
		.replace('*', '')
		.replace('?', '')
		.replace('""', '')
		.replace('<', '')
		.replace('>', '')
		.replace('|', '');
	// Retornamos
	return normTxt;
};
