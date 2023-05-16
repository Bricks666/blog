import { PaginationQueryDto } from '../shared/types';
import { type PostsService, postsService } from './posts.service';
import type { NextFunction, Request, Response } from 'express';
import type { PostDto, SinglePostParamsDto } from './posts.dto';

export class PostsController {
	constructor(private readonly postsService: PostsService) {}

	async getAll(
		req: Request<unknown, PostDto[], unknown, PaginationQueryDto>,
		res: Response<PostDto[]>,
		next: NextFunction
	) {
		try {
			const { count, page, } = req.query;
			const posts = await this.postsService.getAll({ page, count, });
			res.json(posts);
		} catch (error) {
			next(error);
		}
	}

	async getOne(
		req: Request<SinglePostParamsDto, PostDto>,
		res: Response<PostDto>,
		next: NextFunction
	) {
		try {
			const { id, } = req.params;
			const post = await this.postsService.getOne(id);
			res.json(post);
		} catch (error) {
			next(error);
		}
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
