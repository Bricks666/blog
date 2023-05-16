import type { Post, PostAttachedFiles } from '@prisma/client';
import type { SecurityUserDto } from '../users';

export interface FullPost extends Post {
	readonly author: SecurityUserDto;
	readonly files: PostAttachedFiles[];
}
