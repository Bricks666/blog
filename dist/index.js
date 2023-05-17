import { NotFoundError, ForbiddenError, UnauthorizedError, checkValidateErrors, filesValidators, BadRequestError, createErrorHandler } from '@bricks-ether/server-utils';
import express, { Router, json, static as static$1 } from 'express';
import { serve, setup } from 'swagger-ui-express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { dirname, resolve, join as join$1, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { resolve as resolve$1, join } from 'path';
import { body, param, query, oneOf } from 'express-validator';
import { mkdir, unlink } from 'node:fs/promises';
import multer, { diskStorage } from 'multer';

const databaseService = new PrismaClient();

/* eslint-disable no-underscore-dangle */
const PORT = process.env.PORT ?? 5000;
const PASSWORD_SECRET = process.env.PASSWORD_SECRET ?? 'super_puper_password_secret';
const TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'super_puper_token_secret';
const COOKIE_NAME = process.env.COOKIE_NAME ?? 'cookie name';
const __dirname = fileURLToPath(new URL(dirname(import.meta.url)));
fileURLToPath(new URL(import.meta.url));
const STATIC_SERVE_ROOT = resolve(__dirname, 'public');

const hash = (content, solt) => {
    const hasher = createHash('sha256');
    hasher.update(content).update(solt);
    return hasher.digest('hex');
};
const compare = (content, hashed, solt) => {
    const hashedContent = hash(content, solt);
    return hashedContent === hashed;
};

const sign = async (content, secretOrPrivateKey, options = {}) => {
    return new Promise((resolve, reject) => {
        jwt.sign(content, secretOrPrivateKey, options, (err, encoded) => {
            if (err) {
                return reject(err);
            }
            return resolve(encoded);
        });
    });
};
const verify = async (token, secretOrPrivateKey, options = {}) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secretOrPrivateKey, options, (err, encoded) => {
            if (err) {
                return reject(err);
            }
            return resolve(encoded);
        });
    });
};

const withoutStaticRoot = (path) => {
    return path.replace(STATIC_SERVE_ROOT, '');
};
const withStaticRoot = (path) => {
    return resolve$1(join(STATIC_SERVE_ROOT, path));
};

const SECURITY_USER_SELECT = {
    id: true,
    login: true,
};

class UsersRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async getByLogin(login) {
        return this.databaseService.user.findFirst({
            where: {
                login,
            },
        });
    }
    async create(params) {
        return this.databaseService.user.create({
            data: params,
        });
    }
}
const usersRepository = new UsersRepository(databaseService);

class UsersService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async getByLoginInsecure(login) {
        const user = await this.usersRepository.getByLogin(login);
        if (!user) {
            throw new NotFoundError({
                message: 'User not found',
            });
        }
        return user;
    }
    async create(params) {
        const user = await this.usersRepository.create(params);
        return UsersService.satisfyUser(user);
    }
    static satisfyUser(user) {
        return {
            id: user.id,
            login: user.login,
        };
    }
}
const usersService = new UsersService(usersRepository);

class AuthService {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async register(dto) {
        const { login, password, } = dto;
        const hashedPassword = hash(password, PASSWORD_SECRET);
        await this.usersService.create({
            login,
            password: hashedPassword,
        });
    }
    async login(dto) {
        const user = await this.usersService.getByLoginInsecure(dto.login);
        const isValidPassword = compare(dto.password, user.password, PASSWORD_SECRET);
        if (!isValidPassword) {
            throw new ForbiddenError({
                message: 'password is incorrect',
            });
        }
        return UsersService.satisfyUser(user);
    }
    async generateTokens(user) {
        const tokens = [
            await sign(user, TOKEN_SECRET, {
                expiresIn: '15min',
            }),
            await sign(user, TOKEN_SECRET, {
                expiresIn: '30d',
            })
        ];
        const [accessToken, refreshToken] = await Promise.all(tokens);
        return {
            accessToken,
            refreshToken,
        };
    }
    async verifyUser(token) {
        try {
            const user = await verify(token, TOKEN_SECRET);
            return UsersService.satisfyUser(user);
        }
        catch (error) {
            throw new ForbiddenError({
                cause: error,
                message: 'Token is not verifiable',
            });
        }
    }
}
const authService = new AuthService(usersService);

const extractAccessToken = (req) => {
    const header = req.headers.authorization;
    if (!header) {
        throw new UnauthorizedError({
            message: 'There is not auth header',
        });
    }
    const [tokenType, tokenValue] = header.split(' ');
    if (tokenType !== 'Bearer' || !tokenValue) {
        throw new UnauthorizedError({
            message: 'Invalid token',
            cause: [tokenType, tokenValue],
        });
    }
    return tokenValue;
};
const extractRefreshToken = (req) => {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
        throw new ForbiddenError({
            message: 'Cookie is empty',
        });
    }
    return token;
};

class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async auth(req, res, next) {
        try {
            const token = extractRefreshToken(req);
            const user = await this.authService.verifyUser(token);
            const tokens = await this.authService.generateTokens(user);
            res.cookie(COOKIE_NAME, tokens.refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 60 * 24 * 30,
            });
            res.json({
                user,
                tokens,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async registration(req, res, next) {
        try {
            const { login, password, } = req.body;
            await this.authService.register({ login, password, });
            res.status(201).json({
                status: 'registered',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { login, password, } = req.body;
            const user = await this.authService.login({ login, password, });
            const tokens = await this.authService.generateTokens(user);
            res.cookie(COOKIE_NAME, tokens.refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 60 * 24 * 30,
            });
            res.json({ user, tokens, });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res) {
        res.clearCookie(COOKIE_NAME);
        res.json({
            status: 'logout',
        });
    }
    async refresh(req, res, next) {
        try {
            const token = extractRefreshToken(req);
            const user = await this.authService.verifyUser(token);
            const tokens = await this.authService.generateTokens(user);
            res.cookie(COOKIE_NAME, tokens.refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 60 * 24 * 30,
            });
            res.json(tokens);
        }
        catch (error) {
            next(error);
        }
    }
}
const authController = new AuthController(authService);

const authRouter = Router();
authRouter.get('/', authController.auth.bind(authController));
authRouter.put('/registration', body('login').isString(), body('password').isString(), checkValidateErrors(), authController.registration.bind(authController));
authRouter.post('/login', body('login').isString(), body('password').isString(), checkValidateErrors(), authController.login.bind(authController));
authRouter.delete('/logout', authController.logout.bind(authController));
authRouter.get('/refresh', authController.refresh.bind(authController));

// Need for type safety in chain usage
const createRequiredAuth = () => {
    return async (req, _, next) => {
        try {
            const accessToken = extractAccessToken(req);
            const user = await authService.verifyUser(accessToken);
            req.user =
                user;
            return next();
        }
        catch (error) {
            return next(error);
        }
    };
};

const FULL_POST_INCLUDE = {
    author: {
        select: SECURITY_USER_SELECT,
    },
    files: true,
};

const storage = diskStorage({
    destination: async (_, _file, callback) => {
        const destination = join$1(STATIC_SERVE_ROOT, 'posts');
        await mkdir(destination, { recursive: true, });
        callback(null, destination);
    },
    filename: (_, file, callback) => {
        const extension = extname(file.originalname);
        const randomNumber = Math.round(Math.random() * 1e5);
        const fileName = `${randomNumber}-${Date.now()}${extension}`;
        console.info(fileName);
        callback(null, fileName);
    },
});
const postsFileLoader = multer({
    storage,
});

class PostsRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async getAll(page, count) {
        const offset = (page - 1) * count;
        return this.databaseService.post.findMany({
            include: FULL_POST_INCLUDE,
            take: count,
            skip: offset,
        });
    }
    async getOne(id) {
        return this.databaseService.post.findUnique({
            where: {
                id,
            },
            include: FULL_POST_INCLUDE,
        });
    }
    async create(dto) {
        const { authorId, files, content, } = dto;
        const filePaths = files.map((file) => ({ filePath: file, }));
        return this.databaseService.post.create({
            data: {
                authorId,
                content,
                files: {
                    createMany: {
                        data: filePaths,
                        skipDuplicates: true,
                    },
                },
            },
            include: FULL_POST_INCLUDE,
        });
    }
    async update(dto) {
        const { content, id, } = dto;
        return this.databaseService.post.update({
            where: {
                id,
            },
            data: {
                content,
            },
            include: FULL_POST_INCLUDE,
        });
    }
    async addFiles(dto) {
        const { id, files, } = dto;
        const filePaths = files.map((file) => ({ filePath: file, }));
        return this.databaseService.post.update({
            where: {
                id,
            },
            data: {
                files: {
                    createMany: {
                        data: filePaths,
                        skipDuplicates: true,
                    },
                },
            },
            include: FULL_POST_INCLUDE,
        });
    }
    async removeFiles(dto) {
        const { filePaths, id, } = dto;
        return this.databaseService.post.update({
            where: {
                id,
            },
            data: {
                files: {
                    deleteMany: {
                        filePath: {
                            in: filePaths,
                        },
                    },
                },
            },
            include: FULL_POST_INCLUDE,
        });
    }
    async remove(id) {
        await this.databaseService.post.delete({
            where: {
                id,
            },
        });
    }
}
const postsRepository = new PostsRepository(databaseService);

const flatPost = (post) => {
    return {
        id: post.id,
        authorId: post.authorId,
        authorLogin: post.author.login,
        content: post.content,
        createdAt: post.createdAt,
        files: post.files.map((file) => file.filePath),
    };
};

const createSinglePostChain = () => {
    return param('id').toInt().isInt();
};
const createFilesChain = () => {
    return body('files')
        .custom(filesValidators.existsArray)
        .custom(filesValidators.arrayNotEmpty);
};

class PostsService {
    postsRepository;
    constructor(postsRepository) {
        this.postsRepository = postsRepository;
    }
    async getAll(pagination) {
        const { count = 20, page = 1 } = pagination;
        const posts = await this.postsRepository.getAll(page, count);
        return posts.map(flatPost);
    }
    async getOne(id) {
        const post = await this.postsRepository.getOne(id);
        if (!post) {
            throw new NotFoundError({
                message: 'Post not found',
            });
        }
        return flatPost(post);
    }
    async create(dto) {
        const { authorId, files, content } = dto;
        const filePaths = files.map((file) => withoutStaticRoot(file.path));
        const post = await this.postsRepository.create({
            authorId,
            content,
            files: filePaths,
        });
        return flatPost(post);
    }
    async update(dto) {
        const createdPost = await this.getOne(dto.id);
        if (!createdPost.files.length && !dto.content) {
            throw new BadRequestError({
                message: "Content can't be empty if there are not any files",
            });
        }
        const post = await this.postsRepository.update(dto);
        return flatPost(post);
    }
    async addFiles(dto) {
        const { files, id } = dto;
        await this.getOne(dto.id);
        const filePaths = files.map((file) => withoutStaticRoot(file.path));
        const post = await this.postsRepository.addFiles({
            id,
            files: filePaths,
        });
        return flatPost(post);
    }
    async removeFiles(dto) {
        await this.getOne(dto.id);
        const post = await this.postsRepository.removeFiles(dto);
        const deletion = dto.filePaths.map((path) => unlink(withStaticRoot(path)));
        await Promise.all(deletion);
        return flatPost(post);
    }
    async remove(id) {
        const post = await this.getOne(id);
        await this.postsRepository.remove(id);
        const deletion = post.files.map((path) => unlink(withStaticRoot(path)));
        await Promise.all(deletion);
    }
}
const postsService = new PostsService(postsRepository);

class PostsController {
    postsService;
    constructor(postsService) {
        this.postsService = postsService;
    }
    async getAll(req, res, next) {
        try {
            const { count, page, } = req.query;
            const posts = await this.postsService.getAll({ page, count, });
            res.json(posts);
        }
        catch (error) {
            next(error);
        }
    }
    async getOne(req, res, next) {
        try {
            const { id, } = req.params;
            const post = await this.postsService.getOne(id);
            res.json(post);
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const { content, } = req.body;
            const files = req.files;
            const { user, } = req;
            const post = await this.postsService.create({
                authorId: user.id,
                files,
                content,
            });
            res.status(201).json(post);
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const { id, } = req.params;
            const { content = null, } = req.body;
            const post = await this.postsService.update({
                id,
                content,
            });
            res.json(post);
        }
        catch (error) {
            next(error);
        }
    }
    async addFiles(req, res, next) {
        try {
            const { id, } = req.params;
            const files = req.files;
            const post = await this.postsService.addFiles({ files, id, });
            res.json(post);
        }
        catch (error) {
            next(error);
        }
    }
    async removeFiles(req, res, next) {
        try {
            const { id, } = req.params;
            const { filePaths, } = req.body;
            const post = await this.postsService.removeFiles({ id, filePaths, });
            res.json(post);
        }
        catch (error) {
            next(error);
        }
    }
    async remove(req, res, next) {
        try {
            const { id, } = req.params;
            await this.postsService.remove(id);
            res.json({
                status: 'removed',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
const postsController = new PostsController(postsService);

const createIsPostAuthorChecker = (paramName = 'id') => {
    return async (req, _, next) => {
        try {
            const id = Number(req.params[paramName]);
            if (Number.isNaN(id)) {
                throw new BadRequestError({
                    message: `There is not post id called ${paramName}`,
                });
            }
            const { user, } = req;
            const post = await postsService.getOne(id);
            if (post.authorId !== user.id) {
                throw new ForbiddenError({
                    message: `User: ${user.id} can't do this operation with post: ${post.id}`,
                });
            }
            return next();
        }
        catch (error) {
            next(error);
        }
    };
};

const postsRouter = Router();
postsRouter.get('/', query('count').optional().toInt().isInt({
    gt: 0,
}), query('page').optional().toInt().isInt({
    gt: 0,
}), checkValidateErrors(), postsController.getAll.bind(postsController));
postsRouter.get('/:id', createSinglePostChain(), checkValidateErrors(), postsController.getOne.bind(postsController));
postsRouter.post('/create', createRequiredAuth(), postsFileLoader.array('files'), oneOf([body('content').isString().trim().notEmpty(), createFilesChain()]), checkValidateErrors(), postsController.create.bind(postsController));
postsRouter.patch('/:id/update', createSinglePostChain(), createRequiredAuth(), body('content').optional().isString().trim(), createIsPostAuthorChecker(), postsController.update.bind(postsController));
postsRouter.patch('/:id/add-files', createSinglePostChain(), createRequiredAuth(), createIsPostAuthorChecker(), postsFileLoader.array('files'), createFilesChain(), checkValidateErrors(), postsController.addFiles.bind(postsController) // Broken type because calling createFieldsChain
);
postsRouter.patch('/:id/remove-files', createSinglePostChain(), createRequiredAuth(), createIsPostAuthorChecker(), body('filePaths').isArray({ min: 1, }), checkValidateErrors(), postsController.removeFiles.bind(postsController));
postsRouter.delete('/:id/remove', createSinglePostChain(), createRequiredAuth(), createIsPostAuthorChecker(), postsController.remove.bind(postsController));

var openapi = "3.0.0";
var info = {
	title: "WelbeX blog api",
	description: "Документация для тестового задания от компании WelbeX",
	version: "1.0.0"
};
var servers = [
	{
		url: "http://localhost:5000"
	}
];
var paths = {
	"/api/auth": {
		get: {
			summary: "Авторизация по куки",
			description: "Авторизация пользователя по куки, если он входил до этого в аккаунт",
			tags: [
				"Авторизация"
			],
			security: [
				{
					cookie: [
					]
				}
			],
			parameters: [
			],
			responses: {
				"200": {
					description: "Данные о пользователе и токены доступа",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/AuthResponseDto"
							}
						}
					}
				}
			}
		}
	},
	"/api/auth/registration": {
		put: {
			summary: "Регистрация",
			description: "Регистрация нового пользователя в сервисе",
			tags: [
				"Авторизация"
			],
			parameters: [
			],
			requestBody: {
				required: true,
				description: "Данные для регистрации",
				content: {
					"application/json": {
						schema: {
							$ref: "#/components/schemas/CreateUserDto"
						}
					}
				}
			},
			responses: {
				"201": {
					description: "Подтверждение успешной регистрации",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/VoidResponseDto"
							}
						}
					}
				}
			}
		}
	},
	"/api/auth/login": {
		post: {
			summary: "Вход",
			description: "Вход пользователя в аккаунт",
			tags: [
				"Авторизация"
			],
			parameters: [
			],
			requestBody: {
				required: true,
				description: "",
				content: {
					"application/json": {
						schema: {
							$ref: "#/components/schemas/LoginDto"
						}
					}
				}
			},
			responses: {
				"200": {
					description: "",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/TokensPairDto"
							}
						}
					}
				},
				"404": {
					description: "Пользователь с таким логином не зарегистрирован",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				}
			}
		}
	},
	"/api/auth/logout": {
		"delete": {
			summary: "Выход",
			description: "Выход из аккаунта пользователя",
			tags: [
				"Авторизация"
			],
			parameters: [
			],
			responses: {
				"200": {
					description: "Подтверждение успешного выхода",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/VoidResponseDto"
							}
						}
					}
				}
			}
		}
	},
	"/api/auth/refresh": {
		get: {
			summary: "Обновление токена",
			description: "Обновление токена доступа по токену обновления",
			tags: [
				"Авторизация"
			],
			security: [
				{
					cookie: [
					]
				}
			],
			parameters: [
			],
			responses: {
				"200": {
					"403": {
						description: "Отсутствует токен обновления",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/TokensPairDto"
								}
							}
						}
					},
					description: "Обновленные токены",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/TokensPairDto"
							}
						}
					}
				}
			}
		}
	},
	"/api/posts": {
		get: {
			summary: "Получение постов",
			description: "Получение постов по странично",
			tags: [
				"Посты"
			],
			parameters: [
				{
					name: "page",
					description: "Номер страница",
					"in": "query",
					type: "number",
					example: 1,
					defaultValue: 1
				},
				{
					name: "count",
					description: "Количество постов на странице",
					"in": "query",
					type: "number",
					example: 20,
					defaultValue: 20
				}
			],
			responses: {
				"200": {
					description: "Посты на странице",
					content: {
						"application/json": {
							schema: {
								type: "array",
								items: {
									$ref: "#/components/schemas/PostDto"
								}
							}
						}
					}
				},
				"400": {
					description: "Ошибки в данных запроса",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				}
			}
		}
	},
	"/api/posts/{id}": {
		get: {
			summary: "Получение поста",
			description: "Получение конкретного поста",
			tags: [
				"Посты"
			],
			parameters: [
				{
					$ref: "#/components/schemas/SinglePostParamsDto"
				}
			],
			responses: {
				"200": {
					description: "Пост",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/PostDto"
							}
						}
					}
				},
				"400": {
					description: "Ошибки в данных запроса",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				},
				"404": {
					description: "Такого поста нет",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				}
			}
		}
	},
	"/api/posts/create": {
		post: {
			summary: "Создание поста",
			description: "Создание поста",
			tags: [
				"Посты"
			],
			parameters: [
			],
			security: [
				{
					bearer: [
					]
				}
			],
			requestBody: {
				required: true,
				description: "Данные нового поста",
				content: {
					"multipart/form-data": {
						schema: {
							$ref: "#/components/schemas/CreatePostBodyDto"
						}
					}
				}
			},
			responses: {
				"201": {
					description: "Созданный пост",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/PostDto"
							}
						}
					}
				},
				"401": {
					description: "Пользователь не авторизован",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				}
			}
		}
	},
	"/api/posts/{id}/update": {
		patch: {
			summary: "Обновление поста",
			description: "Обновление текстового содержания поста",
			tags: [
				"Посты"
			],
			parameters: [
				{
					$ref: "#/components/schemas/SinglePostParamsDto"
				}
			],
			requestBody: {
				required: false,
				description: "Тестовый контент поста",
				content: {
					"application/json": {
						schema: {
							$ref: "#/components/schemas/UpdatePostBodyDto"
						}
					}
				}
			},
			responses: {
				"200": {
					description: "Обновленный пост",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/PostDto"
							}
						}
					}
				},
				"400": {
					description: "Ошибки в данных запроса",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				},
				"401": {
					description: "Пользователь не авторизован",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				},
				"404": {
					description: "Такого поста нет",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				}
			}
		}
	},
	"/api/posts/{id}/add-files": {
		patch: {
			summary: "Добавление файлов",
			description: "Добавление файлов к посту",
			tags: [
				"Посты"
			],
			parameters: [
				{
					$ref: "#/components/schemas/SinglePostParamsDto"
				}
			],
			requestBody: {
				required: true,
				description: "Файлы",
				content: {
					"multipart/form-data": {
						schema: {
							$ref: "#/components/schemas/AddFilesDto"
						}
					}
				}
			},
			responses: {
				"200": {
					description: "Обновленный пост",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/PostDto"
							}
						}
					}
				},
				"400": {
					description: "Ошибки в данных запроса",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				},
				"401": {
					description: "Пользователь не авторизован",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				},
				"404": {
					description: "Такого поста нет",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				}
			}
		}
	},
	"/api/posts/{id}/remove-file": {
		patch: {
			summary: "Удаление файлов",
			description: "Удаление файлов поста",
			tags: [
				"Посты"
			],
			parameters: [
				{
					$ref: "#/components/schemas/SinglePostParamsDto"
				}
			],
			requestBody: {
				required: true,
				description: "Файлы для удаления",
				content: {
					"application/json": {
						schema: {
							$ref: "#/components/schemas/RemoveFilesDto"
						}
					}
				}
			},
			responses: {
				"200": {
					description: "Обновленный пост",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/PostDto"
							}
						}
					}
				},
				"400": {
					description: "Ошибки в данных запроса",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				},
				"401": {
					description: "Пользователь не авторизован",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				},
				"404": {
					description: "Такого поста нет",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				}
			}
		}
	},
	"/api/posts/{id}/remove": {
		"delete": {
			summary: "Удаление поста",
			description: "Удаление поста",
			tags: [
				"Посты"
			],
			parameters: [
				{
					$ref: "#/components/schemas/SinglePostParamsDto"
				}
			],
			responses: {
				"200": {
					description: "Подтверждение успешного удаления",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/VoidResponseDto"
							}
						}
					}
				},
				"400": {
					description: "Ошибки в данных запроса",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				},
				"401": {
					description: "Пользователь не авторизован",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				},
				"404": {
					description: "Такого поста нет",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/HTTPError"
							}
						}
					}
				}
			}
		}
	}
};
var components = {
	securitySchemes: {
		cookie: {
			type: "apiKey",
			"in": "cookie",
			name: "connect.sid"
		},
		bearer: {
			scheme: "bearer",
			bearerFormat: "JWT",
			type: "http"
		}
	},
	schemas: {
		LoginDto: {
			type: "object",
			properties: {
				login: {
					type: "string",
					description: "Логин",
					example: "login"
				},
				password: {
					type: "string",
					description: "Пароль",
					example: "password"
				}
			},
			required: [
				"login",
				"password"
			]
		},
		TokensPairDto: {
			type: "object",
			properties: {
				accessToken: {
					type: "string",
					description: "Токен доступа",
					example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
				},
				refreshToken: {
					type: "string",
					description: "Токен обновления",
					example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
				}
			},
			required: [
				"accessToken",
				"refreshToken"
			]
		},
		AuthResponseDto: {
			type: "object",
			properties: {
				user: {
					description: "Авторизованный пользователь",
					allOf: [
						{
							$ref: "#/components/schemas/SecurityUserDto"
						}
					]
				},
				tokens: {
					description: "Токены пользователя",
					allOf: [
						{
							$ref: "#/components/schemas/TokensPairDto"
						}
					]
				}
			},
			required: [
				"user",
				"tokens"
			]
		},
		UserDto: {
			type: "object",
			properties: {
				id: {
					type: "number",
					description: "Идентификатор пользователя",
					example: 1
				},
				login: {
					type: "string",
					description: "Логин",
					example: "login"
				},
				password: {
					type: "string",
					description: "Пароль",
					example: "password"
				}
			},
			required: [
				"id",
				"login",
				"password"
			]
		},
		SecurityUserDto: {
			type: "object",
			properties: {
				id: {
					type: "number",
					description: "Идентификатор пользователя",
					example: 1
				},
				login: {
					type: "string",
					description: "Логин",
					example: "login"
				}
			},
			required: [
				"id",
				"login"
			]
		},
		CreateUserDto: {
			type: "object",
			properties: {
				login: {
					type: "string",
					description: "Логин",
					example: "login"
				},
				password: {
					type: "string",
					description: "Пароль",
					example: "password"
				}
			},
			required: [
				"login",
				"password"
			]
		},
		PostDto: {
			type: "object",
			properties: {
				id: {
					type: "number",
					description: "Идентификатор поста",
					example: 1
				},
				authorId: {
					type: "number",
					description: "Идентификатор автора",
					example: 1
				},
				authorLogin: {
					type: "string",
					description: "Логин автора",
					example: "Strange man"
				},
				content: {
					type: "string",
					description: "Тестовый контент поста",
					example: "My good day"
				},
				files: {
					type: "array",
					description: "Ссылки на файлы в посте",
					example: [
						"path/to/file.jpg"
					],
					items: {
						type: "string"
					}
				},
				createdAt: {
					type: "string",
					description: "Дата создания поста",
					example: "2023-05-17T11:50:59.864Z"
				}
			},
			required: [
				"id",
				"authorId",
				"authorLogin",
				"createdAt",
				"content",
				"files"
			]
		},
		CreatePostBodyDto: {
			type: "object",
			properties: {
				content: {
					type: "string",
					description: "Текстовый контент поста",
					example: "My good day"
				},
				files: {
					type: "array",
					description: "Файлы поста",
					example: [
						{
						}
					],
					items: {
					}
				}
			}
		},
		UpdatePostBodyDto: {
			type: "object",
			properties: {
				content: {
					type: "string",
					description: "Текстовый контент поста",
					example: "My good day"
				}
			}
		},
		AddFilesDto: {
			type: "object",
			properties: {
				files: {
					type: "array",
					description: "Файлы для добавления к посту",
					example: [
						{
						}
					],
					items: {
					}
				}
			},
			required: [
				"files"
			]
		},
		RemoveFilesBodyDto: {
			type: "object",
			properties: {
				filePaths: {
					type: "array",
					description: "Пути файлов для удаления из поста",
					example: [
						"path/to/file.jpg"
					],
					items: {
						type: "string"
					}
				}
			},
			required: [
				"filePaths"
			]
		},
		SinglePostParamsDto: {
			name: "id",
			type: "number",
			description: "Идентификатор поста",
			"in": "path",
			example: 1,
			required: true
		},
		PaginationQueryDto: {
			type: "object",
			"in": "query",
			properties: {
				count: {
					type: "number",
					description: "Количество элементов на странице",
					example: 1
				},
				page: {
					type: "number",
					description: "Номер страницы",
					example: 1
				}
			}
		},
		VoidResponseDto: {
			type: "object",
			properties: {
				status: {
					type: "string",
					description: "Сообщение-статус",
					example: "created"
				}
			},
			required: [
				"status"
			]
		},
		HTTPError: {
			type: "object",
			properties: {
				message: {
					type: "string",
					description: "Сообщение ошибки",
					example: "Bad Request"
				},
				cause: {
					type: "object",
					description: "Причина ошибки(объект ошибки или массив таковых)",
					example: {
						error: "ssfkn"
					}
				},
				statusCode: {
					type: "number",
					description: "Код ошибки",
					example: 400
				}
			},
			required: [
				"message",
				"statusCode"
			]
		}
	}
};
var docs = {
	openapi: openapi,
	info: info,
	servers: servers,
	paths: paths,
	components: components
};

config();
const app = express();
app.use(json(), cors(), cookieParser());
app.get('/ping', (_, res) => {
    res.send('pong');
});
const mainRouter = Router();
mainRouter.use('/auth', authRouter);
mainRouter.use('/posts', postsRouter);
app.use('/api', mainRouter);
app.use('/', static$1(STATIC_SERVE_ROOT));
app.use('/docs', serve);
app.get('/docs', setup(docs));
app.use(createErrorHandler());
app.listen(PORT, async () => {
    await databaseService.$connect();
    console.log(`Server start on ${PORT} port`);
});
const onExit = (_, code) => {
    databaseService.$disconnect();
    process.exit(code);
};
process.on('SIGTERM', onExit);
process.on('SIGINT', onExit);
process.on('exit', onExit);
