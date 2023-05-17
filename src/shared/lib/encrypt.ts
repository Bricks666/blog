import { createHash } from 'node:crypto';

export const hash = (content: string, solt: string) => {
	const hasher = createHash('sha256');
	hasher.update(content).update(solt);
	return hasher.digest('hex');
};

export const compare = (
	content: string,
	hashed: string,
	solt: string
): boolean => {
	const hashedContent = hash(content, solt);

	return hashedContent === hashed;
};
