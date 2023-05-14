declare namespace NodeJS {
	interface Process {
		env: ProcessEnv;
	}

	interface ProcessEnv {
		readonly PORT: string;
	}
}
