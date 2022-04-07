/*******************************************************************************************************/
// Importamos las dependencias //
/*******************************************************************************************************/
import express, { json, urlencoded, Request, Response } from 'express';
import cors from 'cors';
import logger from 'morgan';
import helmet from 'helmet';
import fileUpload from 'express-fileupload';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { corsOptions, appEnvironment } from './configs';
import { options as swaggerOptions } from './swagger/setup';
import routes from './routes';

/*******************************************************************************************************/
// Inicializamos la variable de aplicación express //
/*******************************************************************************************************/
const app = express();

/*******************************************************************************************************/
// Middlewares de la aplicación //
/*******************************************************************************************************/
// Asegura nuestra app configurando varios encabezados HTTP, que mitigan los vectores de ataques comunes
app.use(helmet());
// Permite acceder a recursos del servidor desde otros dominios
app.use(cors(corsOptions));
// Realiza un parse de los formatos aplication/json
app.use(json());
// Decodifica los datos enviados desde un formulario
app.use(urlencoded({ extended: false }));
// Realiza un parse de la cookies en las peticiones http al servidor
app.use(cookieParser());
// Habilita compresión en todas las responses del servidor
app.use(compression());
// Logger para ver las peticiones http al servidor
app.use(logger('combined'));
// Permite subir archivos a la aplicación
app.use(
	fileUpload({
		createParentPath: true // Parámetro en caso no exista la ruta la crea
	})
);
// Ruta estática para almacenar los archivos subidos
app.use('/uploads', express.static(join(__dirname, '../uploads')));

/*******************************************************************************************************/
// Rutas de la aplicación //
/*******************************************************************************************************/
routes.map(route => app.use(route.path, route.router));

/*******************************************************************************************************/
// Documentación de las Rutas - Swagger UI (Recomendado sólo en Desarrollo) //
/*******************************************************************************************************/
if (appEnvironment === 'development') {
	// Ruta General
	const swaggerHtml = swaggerUi.generateHTML(swaggerOptions);
	app.use(`/docs`, swaggerUi.serveFiles(swaggerOptions));
	app.get(`/docs`, (req: Request, res: Response) => {
		res.send(swaggerHtml);
	});
	// Rutas por Esquemas
	routes.map(route => {
		const swaggerHtmlRoute = swaggerUi.generateHTML(route.swaggerOptions);
		app.use(`/docs${route.path}`, swaggerUi.serveFiles(route.swaggerOptions));
		app.get(`/docs${route.path}`, (req: Request, res: Response) => {
			res.send(swaggerHtmlRoute);
		});
	});
}

/*******************************************************************************************************/
// Exportamos la variable de aplicación express por defecto //
/*******************************************************************************************************/
export default app;
