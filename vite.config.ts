import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5473,
	    allowedHosts: ['ai.tail21014d.ts.net'],
	},
});
