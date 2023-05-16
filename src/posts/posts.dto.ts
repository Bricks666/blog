import type { Post as PostModel } from '@prisma/client';

export interface PostDto extends PostModel {}

export interface CreatePostBodyDto extends Partial<Pick<PostDto, 'content'>> {}

export interface CreatePostDto extends CreatePostBodyDto {
	readonly authorId: number;
	readonly files: globalThis.Express.Multer.File[];
}

export interface UpdatePostBodyDto extends Partial<Pick<PostDto, 'content'>> {}

export interface UpdatePostDto extends UpdatePostBodyDto {
	readonly authorId: number;
}

export interface SinglePostParamsDto {
	readonly id: number;
}
