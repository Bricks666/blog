import { extname, join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import multer, { diskStorage } from 'multer';
import { STATIC_SERVE_ROOT } from '../../shared/config';

const storage = diskStorage({
	destination: async (_, _file, callback) => {
		const destination = join(STATIC_SERVE_ROOT, 'posts');

		await mkdir(destination, { recursive: true, });
		callback(null, destination);
	},
	filename: (_, file, callback) => {
		const extension = extname(file.originalname);
		const randomNumber = Math.round(Math.random() * 1e5);
		const fileName = `${randomNumber}-${Date.now()}${extension}`;
		console.info(fileName);
		callback(null, fileName);
	},
});

export const postsFileLoader = multer({
	storage,
});
