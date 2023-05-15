import { SecurityUserDto, UserDto } from './users.dto';

export const sanitizeUser = (user: UserDto): SecurityUserDto => {
	return {
		id: user.id,
		login: user.login,
	};
};
