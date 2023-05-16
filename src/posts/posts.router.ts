import { Router } from 'express';
import { postsController } from './posts.controller';

export const postsRouter = Router();

postsRouter.get('/posts', postsController.getAll.bind(postsController));
postsRouter.get('/posts/:id', postsController.getOne.bind(postsController));
postsRouter.post('/posts/create', postsController.create.bind(postsController));
postsRouter.put(
	'/posts/:id/update',
	postsController.update.bind(postsController)
);
postsRouter.patch(
	'/posts/:id/add-files',
	postsController.addFiles.bind(postsController)
);
postsRouter.patch(
	'/posts/:id/remove-files',
	postsController.removeFiles.bind(postsController)
);
postsRouter.delete(
	'/posts/:id/remove',
	postsController.remove.bind(postsController)
);
