import { UnauthorizedError } from '@bricks-ether/server-utils';
import { AccessTokenRequest, AuthUserRequest } from '../../shared/types';
import { authService } from '../auth.service';
import { SecurityUserDto } from '../../users';
import type { RequestHandler } from 'express';

export const extractAuthUser = (): RequestHandler => {
	return async (req, _, next) => {
		try {
			const { accessToken, } = req as AccessTokenRequest;
			if (!accessToken) {
				throw new UnauthorizedError({
					message: 'Access token was not extracted',
				});
			}

			const user = await authService.verifyUser(accessToken);
			(req as AuthUserRequest<SecurityUserDto>).user = user;

			return next();
		} catch (error) {
			return next(error);
		}
	};
};
