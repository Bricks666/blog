import { createErrorHandler } from '@bricks-ether/server-utils';
import express, { Router, json, static as serveStatic } from 'express';
import { serve, setup } from 'swagger-ui-express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import docs from '../openapi.docs.json';
import { databaseService } from './database';
import { authRouter } from './auth';
import { PORT, STATIC_SERVE_ROOT } from './shared/config';
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
app.use('/', serveStatic(STATIC_SERVE_ROOT));
app.use('/docs', serve);
app.get('/docs', setup(docs));

app.use(createErrorHandler());

app.listen(PORT, async () => {
	await databaseService.$connect();
	console.log(`Server start on ${PORT} port`);
});

const onExit = (_: unknown, code: number) => {
	databaseService.$disconnect();
	process.exit(code);
};

process.on('SIGTERM', onExit);

process.on('SIGINT', onExit);

process.on('exit', onExit);
