import { type PostsRepository, postsRepository } from './posts.repository';

export class PostsService {
	constructor(private readonly postsRepository: PostsRepository) {}

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

export const postsService = new PostsService(postsRepository);
