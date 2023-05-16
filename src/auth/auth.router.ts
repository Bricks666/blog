import { checkValidateErrors } from '@bricks-ether/server-utils';
import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from './auth.controller';

export const authRouter = Router();

authRouter.get('/', authController.auth);
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
authRouter.delete('/logout', authController.logout);
authRouter.get('/refresh', authController.refresh);
