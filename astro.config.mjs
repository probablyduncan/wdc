// @ts-check
import { defineConfig } from 'astro/config';

import expressiveCode from 'astro-expressive-code';

export default defineConfig({
    site: "https://wdc.duncanpetrie.com",
    integrations: [expressiveCode({
        themes: ["dark-plus"],
        styleOverrides: {
            codeFontFamily: "Recursive, monospace",
        }
    })],
});