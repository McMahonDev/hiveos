import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
	plugins: [sveltekit(), nodePolyfills()],
	resolve: {
		alias: {
			crypto: 'crypto-browserify',
			stream: 'stream-browserify',
			buffer: 'buffer',
			util: 'util',
			assert: 'assert',
			process: 'process/browser'
		}
	},
	define: {
		global: 'globalThis',
		process: 'process.browser'
	},
	optimizeDeps: {
		include: ['crypto', 'stream', 'buffer', 'util', 'assert', 'process']
	}
});
