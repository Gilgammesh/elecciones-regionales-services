/*******************************************************************************************************/
// Requerimos las dependencias //
/*******************************************************************************************************/
import fs from 'fs';
import { join } from 'path';
import { UploadedFile } from 'express-fileupload';
import { getPathUpload } from './host';

/*******************************************************************************************************/
// Función para devolver la url de acceso público del archivo //
/*******************************************************************************************************/
export const getUrlFile = (file: UploadedFile, path: string, name: string) => {
	// Obtenemos la extensión del archivo
	const arrFileName: string[] = file.name.split('.');
	const exten: string = arrFileName[arrFileName.length - 1];

	// Definimos la Url pública del archivo
	const urlFile: string = `${getPathUpload()}/${path}/${name}.${exten}`;
	// Retornamos
	return urlFile;
};

/*******************************************************************************************************/
// Función para almacenar el archivo en la carpeta uploads //
/*******************************************************************************************************/
export const storeFile = async (file: UploadedFile, path: string, name: string) => {
	// Obtenemos la extensión del archivo
	const arrFileName: string[] = file.name.split('.');
	const exten: string = arrFileName[arrFileName.length - 1];

	// Definimos la ruta del archivo
	const pathFile: string = join(__dirname, '../../uploads', path, `${name}.${exten}`);

	try {
		// Intentamos mover el archivo a la ruta y guardarlo
		await file.mv(pathFile);
		// Retornamos la ruta del archivo guardado
		return pathFile;
	} catch (error) {
		// Mostramos el error en consola
		console.log('Almacenando archivo en Uploads', error);
		return '';
	}
};

/*******************************************************************************************************/
// Función para remover el archivo de la carpeta uploads //
/*******************************************************************************************************/
export const removeFile = async (url: string, path: string) => {
	// Obtenemos el nombre archivo
	const arrUrl: string[] = url.split('/');
	const fileName: string = arrUrl[arrUrl.length - 1];

	// Definimos la ruta del archivo
	const pathFile: string = join(__dirname, '../../uploads', path, fileName);

	try {
		// Intentamos remover el archivo
		fs.unlinkSync(pathFile);
		// Retornamos la ruta del archivo removido
		return pathFile;
	} catch (error) {
		// Mostramos el error en consola
		console.log('Removiendo archivo de Uploads', error);
		// Retornamos
		return '';
	}
};
