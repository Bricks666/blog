import { NotFoundError, ForbiddenError, checkValidateErrors, createErrorHandler } from '@bricks-ether/server-utils';
import express, { Router, json } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';

const databaseService = new PrismaClient();

const PORT = process.env.PORT ?? 5000;
const PASSWORD_SECRET = process.env.PASSWORD_SECRET ?? 'super_puper_password_secret';
const TOKEN_SECRET = process.env.TOKEN_SECRET ?? 'super_puper_token_secret';
const COOKIE_NAME = process.env.COOKIE_NAME ?? 'cookie name';

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
            const { login, password } = req.body;
            await this.authService.register({ login, password });
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
            const { login, password } = req.body;
            const user = await this.authService.login({ login, password });
            const tokens = await this.authService.generateTokens(user);
            res.cookie(COOKIE_NAME, tokens.refreshToken, {
                httpOnly: true,
                secure: true,
                maxAge: 60 * 24 * 30,
            });
            res.json({ user, tokens });
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

config();
const app = express();
app.use(json(), cors(), cookieParser());
app.get('/ping', (_, res) => {
    res.send('pong');
});
const mainRouter = Router();
mainRouter.use('/auth', authRouter);
app.use('/api', mainRouter);
app.use(createErrorHandler());
app.listen(PORT, async () => {
    await databaseService.$connect();
    console.log(`Server start on ${PORT} port`);
});
