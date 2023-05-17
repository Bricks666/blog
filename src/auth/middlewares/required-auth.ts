import { extractAccessToken } from '../lib';
import { authService } from '../auth.service';
import { SecurityUserDto } from '../../users';
import type { ParamsDictionary, Query } from 'express-serve-static-core';
import type { Request, RequestHandler } from 'express';

export interface AuthUserRequest<
	P = ParamsDictionary,
	ResBody = any,
	ReqBody = any,
	ReqQuery = Query,
	Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
	user: SecurityUserDto;
}

// Need for type safety in chain usage
export const createRequiredAuth = <
	P = ParamsDictionary,
	ResBody = any,
	ReqBody = any,
	ReqQuery = Query,
	Locals extends Record<string, any> = Record<string, any>
>(): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> => {
	return async (req, _, next) => {
		try {
			const accessToken = extractAccessToken(req as Request);
			const user = await authService.verifyUser(accessToken);
			(req as AuthUserRequest<P, ResBody, ReqBody, ReqQuery, Locals>).user =
				user;
			return next();
		} catch (error) {
			return next(error);
		}
	};
};
