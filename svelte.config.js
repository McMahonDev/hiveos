import { adapter as cf } from '@sveltejs/adapter-cloudflare';
import { adapter as node } from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const deployment = import.meta.env.VITE_DEPLOYMENT;
const adapter = deployment === 'node' ? node() : cf();
const config = {
	preprocess: vitePreprocess(),
	kit: { adapter: adapter() }
};

export default config;
