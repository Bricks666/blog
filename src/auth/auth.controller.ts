import { VoidResponse } from '../shared/types';
import { COOKIE_NAME } from '../shared/config';
import { AuthService, authService } from './auth.service';
import type { CreateUserDto } from '../users';
import type { NextFunction, Request, Response } from 'express';
import type { AuthResponseDto, LoginDto } from './auth.dto';

export class AuthController {
	constructor(private readonly authService: AuthService) {}

	async registration(
		req: Request<unknown, VoidResponse, CreateUserDto>,
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

	async login(
		req: Request<unknown, AuthResponseDto, LoginDto>,
		res: Response<AuthResponseDto>,
		next: NextFunction
	) {
		try {
			const { login, password, } = req.body;

			const user = await this.authService.login({ login, password, });
			const tokens = this.authService.generateTokens(user);

			res.cookie(COOKIE_NAME, tokens.refreshToken, {
				httpOnly: true,
				secure: true,
				maxAge: 60 * 24 * 30,
			});

			res.json({ user, tokens, });
		} catch (error) {
			next(error);
		}
	}

	async logout(
		req: Request<unknown, VoidResponse>,
		res: Response<VoidResponse>
	) {
		res.clearCookie(COOKIE_NAME);
		res.json({
			status: 'logout',
		});
	}
}

export const authController = new AuthController(authService);
