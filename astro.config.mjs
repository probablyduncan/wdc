// @ts-check
import { defineConfig } from 'astro/config';

import expressiveCode from 'astro-expressive-code';

export default defineConfig({
    integrations: [expressiveCode({
        themes: ["dark-plus"],
    })],
});