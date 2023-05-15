import { CreateUserDto } from '../users';
import { VoidResponse } from '../shared/types';
import { AuthService, authService } from './auth.service';
import type { NextFunction, Request, Response } from 'express';

export class AuthController {
	constructor(private readonly authService: AuthService) {}

	async registration(
		req: Request<void, VoidResponse, CreateUserDto>,
		res: Response<VoidResponse>,
		next: NextFunction
	) {
		try {
			const { login, password, } = req.body;
			await this.authService.register({ login, password, });

			res.status(201).json({
				status: 'registered',
			});
		} catch (error) {
			next(error);
		}
	}
}

export const authController = new AuthController(authService);
