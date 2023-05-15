import { checkValidateErrors } from '@bricks-ether/server-utils';
import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from './auth.controller';

export const authRouter = Router();

authRouter.put(
	'/registration',
	body('login').isString(),
	body('password').isString(),
	checkValidateErrors(),
	authController.registration
);
authRouter.post(
	'/login',
	body('login').isString(),
	body('password').isString(),
	checkValidateErrors(),
	authController.login
);
