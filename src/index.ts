import { createErrorHandler } from '@bricks-ether/server-utils';
import express, { Router, json } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { databaseService } from './database';
import { authRouter } from './auth';
import { PORT } from './shared/config';
import { postsRouter } from './posts';

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

app.use(createErrorHandler());

app.listen(PORT, async () => {
	await databaseService.$connect();
	console.log(`Server start on ${PORT} port`);
});

const onExit = (_, code: number) => {
	databaseService.$disconnect();
	process.exit(code);
};

process.on('SIGTERM', onExit);

process.on('SIGINT', onExit);

process.on('exit', onExit);
