import { BadRequestError, ForbiddenError } from '@bricks-ether/server-utils';
import { postsService } from '../posts.service';
import { AuthUserRequest } from '../../auth';
import type { RequestHandler } from 'express';
import type { ParamsDictionary, Query } from 'express-serve-static-core';

export const createIsPostAuthorChecker = <
	P = ParamsDictionary,
	ResBody = any,
	ReqBody = any,
	ReqQuery = Query,
	Locals extends Record<string, any> = Record<string, any>
>(
		paramName = 'id'
	): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> => {
	return async (req, _, next) => {
		try {
			const id = Number((req.params as ParamsDictionary)[paramName]);
			if (Number.isNaN(id)) {
				throw new BadRequestError({
					message: `There is not post id called ${paramName}`,
				});
			}

			const { user, } = req as AuthUserRequest<
				P,
				ResBody,
				ReqBody,
				ReqQuery,
				Locals
			>;

			const post = await postsService.getOne(id);

			if (post.authorId !== user.id) {
				throw new ForbiddenError({
					message: `User: ${user.id} can't do this operation with post: ${post.id}`,
				});
			}

			return next();
		} catch (error) {
			next(error);
		}
	};
};
