import type { Post as PostModel } from '@prisma/client';

export interface PostDto extends PostModel {
	readonly authorLogin: string;
	readonly files: string[];
}

export interface CreatePostBodyDto extends Partial<Pick<PostDto, 'content'>> {}

export interface CreatePostDto extends CreatePostBodyDto {
	readonly authorId: number;
	readonly files: globalThis.Express.Multer.File[];
}

export interface CreatePostRepositoryDto extends Omit<CreatePostDto, 'files'> {
	readonly files: string[];
}

export interface UpdatePostBodyDto extends Partial<Pick<PostDto, 'content'>> {}

export interface UpdatePostDto extends UpdatePostBodyDto {
	readonly authorId: number;
}

export interface SinglePostParamsDto {
	readonly id: number;
}
