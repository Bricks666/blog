import type { PostDto } from '../posts.dto';
import type { FullPost } from '../types';

export const flatPost = (post: FullPost): PostDto => {
	return {
		id: post.id,
		authorId: post.authorId,
		authorLogin: post.author.login,
		content: post.content,
		createdAt: post.createdAt,
		files: post.files.map((file) => file.filePath),
	};
};
