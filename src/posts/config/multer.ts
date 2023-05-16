import { extname, join, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import multer, { diskStorage } from 'multer';
import { __dirname } from '../../shared/config';

const ROOT = resolve(__dirname, 'public');

const storage = diskStorage({
	destination: async (_, _file, callback) => {
		const destination = join(ROOT, 'posts');

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

export const divisionFileRoot = (path: string): string => {
	return path.replace(ROOT, '');
};
