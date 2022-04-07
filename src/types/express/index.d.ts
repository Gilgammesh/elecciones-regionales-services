declare namespace Express {
	interface Request {
		usuario: {
			_id: string;
			nombres: string;
			apellidos: string;
			dni: string;
			celular: string;
			genero: string;
			img?: string;
			rol: {
				_id: string;
				nombre: string;
				super: boolean;
			};
		};
	}
}
