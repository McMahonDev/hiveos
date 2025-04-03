import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapterNode from '@sveltejs/adapter-node';
import adapterCloudflare from '@sveltejs/adapter-cloudflare';

const deployment = process.env.VITE_DEPLOYMENT || 'node'; // Switched to process.env
const adapter = deployment === 'node' ? adapterNode : adapterCloudflare;

const config = {
	preprocess: vitePreprocess(),
	kit: { adapter: adapter() }
};

export default config;
