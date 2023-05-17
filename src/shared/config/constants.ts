/* eslint-disable no-underscore-dangle */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PORT = process.env.PORT ?? 5000;
export const PASSWORD_SECRET =
	process.env.PASSWORD_SECRET ?? 'super_puper_password_secret';
export const TOKEN_SECRET =
	process.env.TOKEN_SECRET ?? 'super_puper_token_secret';
export const COOKIE_NAME = process.env.COOKIE_NAME ?? 'cookie name';

export const __dirname = fileURLToPath(new URL(dirname(import.meta.url)));
export const __filename = fileURLToPath(new URL(import.meta.url));

export const STATIC_SERVE_ROOT = resolve(__dirname, 'public');
