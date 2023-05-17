import { extname, join } from 'node:path';
import multer, { diskStorage } from 'multer';
import { STATIC_SERVE_ROOT } from '../../shared/config';

export const POSTS_FILES_ROOT = join(STATIC_SERVE_ROOT, 'posts');

const storage = diskStorage({
	destination: POSTS_FILES_ROOT,
	filename: (_, file, callback) => {
		const extension = extname(file.originalname);
		const randomNumber = Math.round(Math.random() * 1e5);
		const fileName = `${randomNumber}-${Date.now()}${extension}`;
		callback(null, fileName);
	},
});

export const postsFileLoader = multer({
	storage,
});
