import {
    aliucordPlugin,
    makeManifest,
    makePluginZip,
} from '@aliucord/rollup-plugin';
import { defineConfig } from 'rollup';

const { plugin, engineDir } = process.env;
if (!engineDir || !plugin) console.error('Incomplete environment variables');

const pluginDir = `./plugins/${plugin}`;

export default defineConfig({
    input: `${pluginDir}/index.ts`,
    output: {
        file: `dist/${plugin}.js`,
    },
    plugins: [
        aliucordPlugin({
            autoDeploy: !!process.env['ROLLUP_WATCH'],
            hermesPath: engineDir!,
        }),
        makeManifest({
            baseManifest: 'manifest.json',
            manifest: `${pluginDir}/manifest.json`,
        }),
        makePluginZip(),
    ],
});
