import { defineConfig } from 'rollup';
import commonJs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default defineConfig({
	input: './src/index.ts',
	output: {
		dir: 'dist',
		format: 'esm',
	},
	external: [/\.json/],
	plugins: [
		typescript({
			tsconfig: './tsconfig.json',
		}),
		commonJs({ extensions: ['.js', '.ts'] }),
	],
});
