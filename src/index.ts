import express, { json } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(json(), cors(), cookieParser());

app.get('/ping', (_, res) => {
	res.send('pong');
});

const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
	console.log(`Server start on ${PORT} port`);
});
