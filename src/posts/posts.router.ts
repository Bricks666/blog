import { checkValidateErrors } from '@bricks-ether/server-utils';
import { Router } from 'express';
import { body, oneOf, query } from 'express-validator';
import { createRequiredAuth } from '../auth';
import { postsController } from './posts.controller';
import { createFilesChain, createSinglePostChain } from './lib';
import { createIsPostAuthorChecker } from './middlewares';
import { postsFileLoader } from './config';

export const postsRouter = Router();

postsRouter.get(
	'/',
	query('count').optional().toInt().isInt({
		gt: 0,
	}),
	query('page').optional().toInt().isInt({
		gt: 0,
	}),
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
	oneOf([body('content').isString().trim().notEmpty(), createFilesChain()]),
	checkValidateErrors(),
	postsController.create.bind(postsController)
);
postsRouter.patch(
	'/:id/update',
	createSinglePostChain(),
	createRequiredAuth(),
	body('content').optional().isString().trim(),
	createIsPostAuthorChecker(),
	postsController.update.bind(postsController)
);
postsRouter.patch(
	'/:id/add-files',
	createSinglePostChain(),
	createRequiredAuth(),
	createIsPostAuthorChecker(),
	postsFileLoader.array('files'),
	createFilesChain(),
	checkValidateErrors(),
	postsController.addFiles.bind(postsController) as any // Broken type because calling createFieldsChain
);
postsRouter.patch(
	'/:id/remove-files',
	createSinglePostChain(),
	createRequiredAuth(),
	createIsPostAuthorChecker(),
	body('filePaths').isArray({ min: 1, }),
	checkValidateErrors(),
	postsController.removeFiles.bind(postsController)
);
postsRouter.delete(
	'/:id/remove',
	createSinglePostChain(),
	createRequiredAuth(),
	createIsPostAuthorChecker(),
	postsController.remove.bind(postsController)
);
