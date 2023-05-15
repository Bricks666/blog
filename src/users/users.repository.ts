import { databaseService, type DatabaseService } from '../database';
import { CreateUserDto, UserDto } from './users.dto';

export class UsersRepository {
	constructor(private readonly databaseService: DatabaseService) {}

	async getByLogin(login: string): Promise<UserDto | null> {
		return this.databaseService.user.findFirst({
			where: {
				login,
			},
		});
	}

	async create(params: CreateUserDto): Promise<UserDto> {
		return this.databaseService.user.create({
			data: params,
		});
	}
}

export const usersRepository = new UsersRepository(databaseService);
