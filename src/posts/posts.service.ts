import { NotFoundError } from '@bricks-ether/server-utils';
import { type PostsRepository, postsRepository } from './posts.repository';
import { flatPost } from './lib';
import { divisionFileRoot } from './config';
import type { PaginationQueryDto } from '../shared/types';
import type { CreatePostDto, PostDto } from './posts.dto';

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

	async create(dto: CreatePostDto): Promise<PostDto> {
		const { authorId, files, content, } = dto;
		const filePaths = files.map((file) => divisionFileRoot(file.path));

		const post = await this.postsRepository.create({
			authorId,
			content,
			files: filePaths,
		});

		return flatPost(post);
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

	async remove(id: number): Promise<void> {
		await this.postsRepository.remove(id);
	}
}

export const postsService = new PostsService(postsRepository);
