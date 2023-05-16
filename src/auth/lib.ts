import { Request } from 'express';
import { ForbiddenError, UnauthorizedError } from '@bricks-ether/server-utils';
import { COOKIE_NAME } from '../shared/config';

export const extractAccessToken = (req: Request): string => {
	const header = req.headers.authorization;
	if (!header) {
		throw new UnauthorizedError({
			message: 'There is not auth header',
		});
	}

	const [tokenType, tokenValue] = header.split(' ');
	if (tokenType !== 'Bearer' || !tokenValue) {
		throw new UnauthorizedError({
			message: 'Invalid token',
			cause: [tokenType, tokenValue],
		});
	}

	return tokenValue;
};

export const extractRefreshToken = (req: Request): string => {
	const cookie = req.cookies[COOKIE_NAME];
	if (!cookie) {
		throw new ForbiddenError({
			message: 'Cookie is empty',
		});
	}

	const [tokenType, tokenValue] = cookie.split(' ');
	if (tokenType !== 'Bearer' || !tokenValue) {
		throw new ForbiddenError({
			message: 'Invalid token',
			cause: [tokenType, tokenValue],
		});
	}

	return tokenValue;
};
