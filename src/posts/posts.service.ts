import { BadRequestError, NotFoundError } from '@bricks-ether/server-utils';
import { type PostsRepository, postsRepository } from './posts.repository';
import { flatPost } from './lib';
import { divisionFileRoot } from './config';
import type { PaginationQueryDto } from '../shared/types';
import type {
	AddFilesDto,
	CreatePostDto,
	PostDto,
	RemoveFilesDto,
	UpdatePostDto
} from './posts.dto';

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

	async update(dto: UpdatePostDto): Promise<PostDto> {
		const createdPost = await this.getOne(dto.id);

		if (!createdPost.files.length && !dto.content) {
			throw new BadRequestError({
				message: "Content can't be empty if there are not any files",
			});
		}

		const post = await this.postsRepository.update(dto);

		return flatPost(post);
	}

	async addFiles(dto: AddFilesDto): Promise<PostDto> {
		const { files, id, } = dto;
		const filePaths = files.map((file) => divisionFileRoot(file.path));

		const post = await this.postsRepository.addFiles({
			id,
			files: filePaths,
		});

		return flatPost(post);
	}

	async removeFiles(dto: RemoveFilesDto): Promise<PostDto> {
		const post = await this.postsRepository.removeFiles(dto);

		return flatPost(post);
	}

	async remove(id: number): Promise<void> {
		await this.postsRepository.remove(id);
	}
}

export const postsService = new PostsService(postsRepository);
