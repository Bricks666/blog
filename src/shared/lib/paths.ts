import { STATIC_SERVE_ROOT } from '../config';

export const withoutStaticRoot = (path: string): string => {
	return path.replace(STATIC_SERVE_ROOT, '');
};
