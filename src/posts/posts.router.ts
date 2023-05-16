import {
	checkValidateErrors,
	filesValidators
} from '@bricks-ether/server-utils';
import { Router } from 'express';
import { body, oneOf, query } from 'express-validator';
import { createRequiredAuth } from '../auth';
import { postsController } from './posts.controller';
import { createSinglePostChain } from './lib';
import { createIsPostAuthorChecker } from './middlewares';
import { postsFileLoader } from './config';

export const postsRouter = Router();

postsRouter.get(
	'/',
	query('count').optional().toInt().isInt(),
	query('page').optional().toInt().isInt(),
	checkValidateErrors(),
	postsController.getAll.bind(postsController)
);
postsRouter.get(
	'/:id',
	createSinglePostChain(),
	checkValidateErrors(),
	postsController.getOne.bind(postsController)
);
postsRouter.post(
	'/create',
	createRequiredAuth(),
	postsFileLoader.array('files'),
	oneOf([
		body('content').isString().trim().notEmpty(),
		body('files')
			.custom(filesValidators.existsArray)
			.custom(filesValidators.arrayNotEmpty)
	]),
	checkValidateErrors(),
	postsController.create.bind(postsController)
);
postsRouter.put(
	'/:id/update',
	createSinglePostChain(),
	createRequiredAuth(),
	createIsPostAuthorChecker(),
	postsController.update.bind(postsController)
);
postsRouter.patch(
	'/:id/add-files',
	createSinglePostChain(),
	createRequiredAuth(),
	createIsPostAuthorChecker(),
	postsFileLoader.array('files'),
	postsController.addFiles.bind(postsController)
);
postsRouter.patch(
	'/:id/remove-files',
	createSinglePostChain(),
	createRequiredAuth(),
	createIsPostAuthorChecker(),
	postsController.removeFiles.bind(postsController)
);
postsRouter.delete(
	'/:id/remove',
	createSinglePostChain(),
	createRequiredAuth(),
	createIsPostAuthorChecker(),
	postsController.remove.bind(postsController)
);
