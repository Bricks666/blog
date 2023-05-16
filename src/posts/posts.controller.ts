import { type PostsService, postsService } from './posts.service';

export class PostsController {
	constructor(private readonly postsService: PostsService) {}

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

export const postsController = new PostsController(postsService);
