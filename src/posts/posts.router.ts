import { checkValidateErrors } from '@bricks-ether/server-utils';
import { Router } from 'express';
import { param, query } from 'express-validator';
import { postsController } from './posts.controller';

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
	param('id').toInt().isInt(),
	checkValidateErrors(),
	postsController.getOne.bind(postsController)
);
postsRouter.post('/create', postsController.create.bind(postsController));
postsRouter.put('/:id/update', postsController.update.bind(postsController));
postsRouter.patch(
	'/:id/add-files',
	postsController.addFiles.bind(postsController)
);
postsRouter.patch(
	'/:id/remove-files',
	postsController.removeFiles.bind(postsController)
);
postsRouter.delete('/:id/remove', postsController.remove.bind(postsController));
