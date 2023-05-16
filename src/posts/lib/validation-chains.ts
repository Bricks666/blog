import { param } from 'express-validator';

export const createSinglePostChain = () => {
	return param('id').toInt().isInt();
};
