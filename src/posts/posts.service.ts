import { NotFoundError } from '@bricks-ether/server-utils';
import { type PostsRepository, postsRepository } from './posts.repository';
import { flatPost } from './lib';
import type { PaginationQueryDto } from '../shared/types';
import type { PostDto } from './posts.dto';

export class PostsService {
	constructor(private readonly postsRepository: PostsRepository) {}

	async getAll(pagination: PaginationQueryDto): Promise<PostDto[]> {
		const { count = 20, page = 1, } = pagination;
		const posts = await this.postsRepository.getAll(page, count);
		return posts.map(flatPost);
	}

	async getOne(id: number): Promise<PostDto> {
		const post = await this.postsRepository.getOne(id);

		if (!post) {
			throw new NotFoundError({
				message: 'Post not found',
			});
		}

		return flatPost(post);
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
