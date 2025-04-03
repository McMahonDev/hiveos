import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapterNode from '@sveltejs/adapter-node';
import adapterCloudflare from '@sveltejs/adapter-cloudflare';

const adapter = import.meta.env.VITE_DEPLOYMENT == 'node' ? adapterNode : adapterCloudflare;

const config = {
	preprocess: vitePreprocess(),
	kit: { adapter: adapter() }
};

export default config;
