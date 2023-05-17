import { join, resolve } from 'path';
import { STATIC_SERVE_ROOT } from '../config';

export const withoutStaticRoot = (path: string): string => {
	return path.replace(STATIC_SERVE_ROOT, '');
};

export const withStaticRoot = (path: string): string => {
	return resolve(join(STATIC_SERVE_ROOT, path));
};
