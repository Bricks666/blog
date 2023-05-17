/* eslint-disable no-plusplus */
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { databaseService } from './database';
import { CreateUserDto, SecurityUserDto, usersService } from './users';
import { STATIC_SERVE_ROOT } from './shared/config';
import { withoutStaticRoot } from './shared/lib';

const mockUsers: CreateUserDto[] = [
	{
		login: 'user 1',
		password: 'password 1',
	},
	{
		login: 'user 2',
		password: 'password 2',
	},
	{
		login: 'user 3',
		password: 'password 3',
	}
];

const createUsers = async () => {
	const users = await databaseService.user.findMany({
		take: mockUsers.length,
	});
	if (users.length) {
		return users;
	}

	// For password hashing
	return Promise.all(mockUsers.map((user) => usersService.create(user)));
};

const POSTS_COUNT = 5;

const createPosts = async (users: SecurityUserDto[]) => {
	const postsCount = await Promise.all(
		users.map((user) =>
			databaseService.post.count({
				where: {
					authorId: user.id,
				},
			})
		)
	);

	const requests = users.map(async (user, index) => {
		const count = postsCount[index];

		if (count >= POSTS_COUNT) {
			return [];
		}

		const mockJsonFile = {
			user: user.id,
			content: 'safkbsdfb',
		};
		const path = join(STATIC_SERVE_ROOT, 'posts', `${user.id}-post.json`);
		const requests: Promise<unknown>[] = [];

		await writeFile(path, JSON.stringify(mockJsonFile), {
			encoding: 'utf-8',
		});

		for (let i = 0; i < POSTS_COUNT - count; i++) {
			const content = i % 2 ? 'some content' : null;
			const files = i
				? undefined
				: {
					create: {
						filePath: withoutStaticRoot(path),
					},
				  };
			requests.push(
				databaseService.post.create({
					data: {
						authorId: user.id,
						content,
						files,
					},
				})
			);
		}

		return Promise.all(requests);
	});
	return Promise.all(requests);
};

export const fillDB = async () => {
	const users = await createUsers();
	await createPosts(users);
};
