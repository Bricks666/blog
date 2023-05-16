import { type DatabaseService, databaseService } from '../database';
import { FULL_POST_INCLUDE } from './config';
import type { CreatePostRepositoryDto } from './posts.dto';
import type { FullPost } from './types';

export class PostsRepository {
	constructor(private readonly databaseService: DatabaseService) {}

	async getAll(page: number, count: number): Promise<FullPost[]> {
		const offset = (page - 1) * count;
		return this.databaseService.post.findMany({
			include: FULL_POST_INCLUDE,
			take: count,
			skip: offset,
		});
	}

	async getOne(id: number): Promise<FullPost | null> {
		return this.databaseService.post.findUnique({
			where: {
				id,
			},
			include: FULL_POST_INCLUDE,
		});
	}

	async create(dto: CreatePostRepositoryDto): Promise<FullPost> {
		const { authorId, files, content, } = dto;
		const filePaths = files.map((file) => ({ filePath: file, }));
		return this.databaseService.post.create({
			data: {
				authorId,
				content,
				files: {
					createMany: {
						data: filePaths,
						skipDuplicates: true,
					},
				},
			},
			include: FULL_POST_INCLUDE,
		});
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
		await this.databaseService.post.delete({
			where: {
				id,
			},
		});
	}
}

export const postsRepository = new PostsRepository(databaseService);
