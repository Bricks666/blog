import { PaginationQueryDto, VoidResponse } from '../shared/types';
import { AuthUserRequest } from '../auth';
import { type PostsService, postsService } from './posts.service';
import type { NextFunction, Request, Response } from 'express';
import type {
	CreatePostBodyDto,
	PostDto,
	SinglePostParamsDto
} from './posts.dto';

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

	async create(
		req: Request<unknown, PostDto, CreatePostBodyDto>,
		res: Response<PostDto>,
		next: NextFunction
	) {
		try {
			const { content, } = req.body;
			const files = req.files as Array<globalThis.Express.Multer.File>;

			const { user, } = req as AuthUserRequest<
				unknown,
				PostDto,
				CreatePostBodyDto
			>;
			const post = await this.postsService.create({
				authorId: user.id,
				files,
				content,
			});
			res.json(post);
		} catch (error) {
			next(error);
		}
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

	async remove(
		req: Request<SinglePostParamsDto, VoidResponse>,
		res: Response<VoidResponse>,
		next: NextFunction
	) {
		try {
			const { id, } = req.params;
			await this.postsService.remove(id);
			res.json({
				status: 'removed',
			});
		} catch (error) {
			next(error);
		}
	}
}

export const postsController = new PostsController(postsService);
