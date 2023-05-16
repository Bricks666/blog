import { ForbiddenError } from '@bricks-ether/server-utils';
import { PASSWORD_SECRET, TOKEN_SECRET } from '../shared/config';
import { encrypt, jwt } from '../shared/lib';
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

	async generateTokens(user: SecurityUserDto): Promise<TokensPairDto> {
		const tokens = [
			await jwt.sign(user, TOKEN_SECRET, {
				expiresIn: '15min',
			}),
			await jwt.sign(user, TOKEN_SECRET, {
				expiresIn: '30d',
			})
		];
		const [accessToken, refreshToken] = await Promise.all(tokens);

		return {
			accessToken,
			refreshToken,
		};
	}

	async verifyUser(token: string): Promise<SecurityUserDto> {
		try {
			const user = await jwt.verify<SecurityUserDto>(token, TOKEN_SECRET);
			return UsersService.satisfyUser(user);
		} catch (error) {
			throw new ForbiddenError({
				cause: error,
				message: 'Token is not verifiable',
			});
		}
	}
}

export const authService = new AuthService(usersService);
