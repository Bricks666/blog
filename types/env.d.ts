declare namespace NodeJS {
	interface Process {
		env: ProcessEnv;
	}

	interface ProcessEnv {
		readonly PORT: string;
		readonly TOKEN_SECRET: string;
		readonly PASSWORD_SECRET: string;
		readonly COOKIE_NAME: string;
	}
}
