import { databaseService, type DatabaseService } from '../database';
import { CreateUserDto, UserDto } from './users.dto';

export class UsersRepository {
	constructor(private readonly databaseService: DatabaseService) {}

	async getOne(id: number): Promise<UserDto | null> {
		return this.databaseService.user.findUnique({
			where: {
				id,
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
