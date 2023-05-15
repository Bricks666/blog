import { PASSWORD_SECRET } from '../shared/config';
import { encrypt } from '../shared/lib';
import { type UsersRepository, usersRepository, CreateUserDto } from '../users';

export class AuthService {
	constructor(private readonly usersRepository: UsersRepository) {}

	async register(dto: CreateUserDto): Promise<void> {
		const { login, password, } = dto;
		const hashedPassword = encrypt.hash(password, PASSWORD_SECRET);

		await this.usersRepository.create({
			login,
			password: hashedPassword,
		});
	}
}

export const authService = new AuthService(usersRepository);
