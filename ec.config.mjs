import { defineEcConfig } from 'astro-expressive-code'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'

export default defineEcConfig({
    plugins: [pluginCollapsibleSections()],
    frames: {
        showCopyToClipboardButton: false,
    },
    styleOverrides: {
        codeFontSize: "1rem",
    },
    defaultProps: {
        collapseStyle: "collapsible-start",
    }
})