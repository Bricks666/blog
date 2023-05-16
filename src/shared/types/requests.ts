import type { Request } from 'express';
import type { Query, ParamsDictionary } from 'express-serve-static-core';

export interface AccessTokenRequest<
	P = ParamsDictionary,
	ResBody = any,
	ReqBody = any,
	ReqQuery = Query,
	Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
	accessToken: string;
}

export interface AuthUserRequest<
	User,
	P = ParamsDictionary,
	ResBody = any,
	ReqBody = any,
	ReqQuery = Query,
	Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
	user: User;
}

export interface PaginationQueryDto {
	readonly count?: number;
	readonly page?: number;
}
