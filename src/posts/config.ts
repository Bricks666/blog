import { SECURITY_USER_SELECT } from '../users';
import type { Prisma } from '@prisma/client';

export const FULL_POST_INCLUDE = {
	author: {
		select: SECURITY_USER_SELECT,
	},
	files: true,
} satisfies Prisma.PostInclude;
