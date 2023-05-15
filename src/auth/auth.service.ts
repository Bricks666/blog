import { ForbiddenError } from '@bricks-ether/server-utils';
import jwt from 'jsonwebtoken';
import { PASSWORD_SECRET, TOKEN_SECRET } from '../shared/config';
import { encrypt } from '../shared/lib';
import {
	type CreateUserDto,
	UsersService,
	SecurityUserDto,
	usersService
} from '../users';
import type { LoginDto, TokensPairDto } from './auth.dto';

export class AuthService {
	constructor(private readonly usersService: UsersService) {}

	async register(dto: CreateUserDto): Promise<void> {
		const { login, password, } = dto;
		const hashedPassword = encrypt.hash(password, PASSWORD_SECRET);

		await this.usersService.create({
			login,
			password: hashedPassword,
		});
	}

	async login(dto: LoginDto): Promise<SecurityUserDto> {
		const user = await this.usersService.getByLoginInsecure(dto.login);

		const isValidPassword = encrypt.compare(
			dto.password,
			user.password,
			PASSWORD_SECRET
		);
		if (!isValidPassword) {
			throw new ForbiddenError({
				message: 'password is incorrect',
			});
		}

		return UsersService.satisfyUser(user);
	}

	generateTokens(user: SecurityUserDto): TokensPairDto {
		const accessToken = jwt.sign(user, TOKEN_SECRET, {
			expiresIn: '15min',
		});
		const refreshToken = jwt.sign(user, TOKEN_SECRET, {
			expiresIn: '30d',
		});

		return {
			accessToken,
			refreshToken,
		};
	}
}

export const authService = new AuthService(usersService);
