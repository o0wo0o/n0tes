// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';


export default defineConfig({
	site: 'https://o0wo0o.github.io',
	integrations: [mdx(), sitemap()],
	base: "n0tes"
});
