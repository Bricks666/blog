import { type DatabaseService, databaseService } from '../database';

export class PostsRepository {
	constructor(private readonly databaseService: DatabaseService) {}

	async getAll() {
		return null;
	}

	async getOne() {
		return null;
	}

	async create() {
		return null;
	}

	async update() {
		return null;
	}

	async addFiles() {
		return null;
	}

	async removeFiles() {
		return null;
	}

	async remove() {
		return null;
	}
}

export const postsRepository = new PostsRepository(databaseService);
