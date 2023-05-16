import { RequestHandler } from 'express';
import { extractAccessToken } from '../lib';
import { authService } from '../auth.service';
import { AccessTokenRequest } from '../../shared/types';

export const requiredAuth = (): RequestHandler => {
	return async (req, _, next) => {
		try {
			const accessToken = extractAccessToken(req);
			await authService.verifyUser(accessToken);
			(req as AccessTokenRequest).accessToken = accessToken;
			return next();
		} catch (error) {
			return next(error);
		}
	};
};
