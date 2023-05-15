import { SecurityUserDto } from '../users';

export interface LoginDto {
	readonly login: string;
	readonly password: string;
}

export interface TokensPairDto {
	readonly accessToken: string;
	readonly refreshToken: string;
}

export interface AuthResponseDto {
	readonly user: SecurityUserDto;
	readonly tokens: TokensPairDto;
}
