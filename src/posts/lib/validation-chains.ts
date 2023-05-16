import { filesValidators } from '@bricks-ether/server-utils';
import { body, param } from 'express-validator';

export const createSinglePostChain = () => {
	return param('id').toInt().isInt();
};

export const createFilesChain = () => {
	return body('files')
		.custom(filesValidators.existsArray)
		.custom(filesValidators.arrayNotEmpty);
};
