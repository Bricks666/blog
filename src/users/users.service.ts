import { NotFoundError } from '@bricks-ether/server-utils';
import { type UsersRepository, usersRepository } from './users.repository';
import type { CreateUserDto, SecurityUserDto, UserDto } from './users.dto';

export class UsersService {
	constructor(private readonly usersRepository: UsersRepository) {}

	async getByLoginInsecure(login: string): Promise<UserDto> {
		const user = await this.usersRepository.getByLogin(login);
		if (!user) {
			throw new NotFoundError({
				message: 'User not found',
			});
		}

		return user;
	}

	async create(params: CreateUserDto): Promise<SecurityUserDto> {
		const user = await this.usersRepository.create(params);
		return UsersService.satisfyUser(user);
	}

	static satisfyUser(user: UserDto): SecurityUserDto {
		return {
			id: user.id,
			login: user.login,
		};
	}
}

export const usersService = new UsersService(usersRepository);
