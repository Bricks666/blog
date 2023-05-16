import { checkValidateErrors } from '@bricks-ether/server-utils';
import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from './auth.controller';

export const authRouter = Router();

authRouter.get('/', authController.auth.bind(authController));
authRouter.put(
	'/registration',
	body('login').isString(),
	body('password').isString(),
	checkValidateErrors(),
	authController.registration.bind(authController)
);
authRouter.post(
	'/login',
	body('login').isString(),
	body('password').isString(),
	checkValidateErrors(),
	authController.login.bind(authController)
);
authRouter.delete('/logout', authController.logout.bind(authController));
authRouter.get('/refresh', authController.refresh.bind(authController));
