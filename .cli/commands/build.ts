import { program as Program, Option } from '@commander-js/extra-typings';
import chalk from 'chalk';
import { spawnSync } from 'child_process';
import { globSync as glob } from 'glob';
import logger from '../util/logger.js';
import type CLIContext from '../types/CLIContext.js';
import formatPluginList from '../util/formatPluginList.js';

export default function Build(program: typeof Program, context: CLIContext) {
    return program
        .command('build')
        .description('Builds a plugin')
        .argument('[plugin]', 'The plugin to build')
        .addOption(
            new Option('-a, --all', 'Builds all plugins').conflicts('watch')
        )
        .option(
            '-f, --force',
            'Forces to build even if the plugin is invalid or not available'
        )
        .option('-w, --watch', 'Watch for changes and rebuild automatically')
        .action((plugin: string | undefined, options) => {
            const { force, watch, all: buildAll } = options;
            const { packageManager, plugins: pluginObjects } = context;

            logger.debug(
                `RUNNING BUILD COMMAND\n` +
                    `User has targeted plugin ${plugin}\n` +
                    `Options passed\n` +
                    Object.entries(options)
                        .map(([key, value]) => ` - ${key}: ${value}`)
                        .join('\n')
            );

            if (!SupportedPackageManagers.includes(packageManager) && !force) {
                logger.error(
                    `Package manager unsupported by CLI.\n\n` +
                        `${chalk.cyan(
                            'Currently supported package managers:'
                        )}\n` +
                        `${SupportedPackageManagers.map(
                            pm => `- ${chalk.yellow(pm)}`
                        ).join('\n')}\n\n` +
                        `${chalk.cyan('Possible solutions:')}\n` +
                        ` - Open an issue in the GitHub repository about your package manager\n` +
                        ` - Use one of the supported package managers\n` +
                        ` - Run this command with the ${chalk.yellow(
                            '--force'
                        )} flag\n` +
                        ` - Forcefully set the ${chalk.yellow(
                            'defaultPackageManager'
                        )} variable in the ${chalk.cyan(
                            '.cli/index.ts'
                        )} file to one of the supported package managers ${chalk.yellow(
                            '(not recommended)'
                        )}.`
                );

                process.exit(1);
            }

            const plugins = pluginObjects.map(p => p.name);
            const [unavailablePlugins, availablePlugins] = [
                pluginObjects.filter(p => !p.available).map(p => p.name),
                pluginObjects.filter(p => p.available).map(p => p.name),
            ];

            if (!plugin && !buildAll) {
                logger.error(
                    `No plugin(s) to build. You must either supply the ${chalk.yellow(
                        'plugin'
                    )} argument or run with the ${chalk.yellow(
                        '--all'
                    )} flag.\n\n` +
                        formatPluginList(availablePlugins, unavailablePlugins)
                );
                process.exit(1);
            }

            if (!buildAll && !availablePlugins.includes(plugin!)) {
                if (unavailablePlugins.includes(plugin!)) {
                    if (!force) {
                        logger.error(
                            `Plugin ${chalk.yellow(
                                plugin
                            )} is not available.\n\n` +
                                `${chalk.cyan('Possible solutions:\n')}\n` +
                                ` - Check if the plugin is missing the ${chalk.yellow(
                                    'index.ts'
                                )} or the ${chalk.yellow(
                                    'package.json'
                                )} file\n` +
                                ` - Force the build process by using the ${chalk.redBright(
                                    '--force'
                                )} flag`
                        );

                        process.exit(1);
                    }
                } else {
                    logger.error(
                        `Plugin ${chalk.yellow(plugin)} not found.\n\n` +
                            `${chalk.cyan('Possible solutions:')}\n` +
                            ` - Check if the plugin exists in the ${chalk.yellow(
                                'plugins'
                            )} directory\n\n` +
                            formatPluginList(
                                availablePlugins,
                                unavailablePlugins
                            )
                    );

                    process.exit(1);
                }
            }

            if (buildAll) {
                if (!force) logger.info(`Building all available plugins...`);
                else logger.warn(`Forcing the build process of all plugins...`);
            }

            if (force)
                logger.warn(
                    `Forcing the build process of the plugin ${chalk.yellow(
                        plugin
                    )}...\n`
                );

            const pluginsToBuild = buildAll
                ? force
                    ? plugins
                    : availablePlugins
                : [plugin];

            logger.debug(
                `There are ${pluginsToBuild.length} plugin(s) to build\n` +
                    pluginsToBuild.map(p => ` - ${p}`).join('\n')
            );

            logger.info(
                `Building ${
                    pluginsToBuild.length
                } plugin(s) with ${chalk.yellow(packageManager)}...`
            );
            if (watch)
                logger.info(
                    `Watching is enabled, automatically reloading when a file changes...`
                );

            logger.newLine();

            const startTS = Date.now();

            for (const plugin of pluginsToBuild) {
                logger.info(`Building plugin ${chalk.yellow(plugin)}...`);
                const errors = buildPlugin(
                    plugin!,
                    packageManager,
                    watch ?? false
                );
                if (errors)
                    logger.error(
                        `Failed to build ${chalk.yellow(
                            plugin
                        )} because a compilation error occured`
                    ),
                        logger.debug(`Got error\n${errors.toString()}`);
            }

            const buildTimeSecs = (Date.now() - startTS) / 1000;

            logger.info(
                `Finished building ${
                    pluginsToBuild.length
                } plugin(s) in ${chalk[
                    buildTimeSecs < 30
                        ? 'greenBright'
                        : buildTimeSecs < 60
                        ? 'yellow'
                        : 'redBright'
                ](`${buildTimeSecs}s`)}`
            );

            logger.debug('finished build lets go');
        });
}

export function buildPlugin(
    plugin: string,
    packageManager: string,
    watch: boolean
) {
    const rollupExecutablePath =
        process.platform === 'win32'
            ? '.\\node_modules\\.bin\\rollup.cmd'
            : './node_modules/.bin/rollup';

    logger.debug(
        `Determinted that the rollup executable is at ${rollupExecutablePath}`
    );

    const args = ['-c', '--configPlugin', 'typescript'];
    if (watch) args.push('--watch');

    logger.debug(
        'Spawing rollup with arguments\n' +
            args.map(arg => ` - ${arg}`).join('\n')
    );

    const proc = spawnSync(rollupExecutablePath, args, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: {
            plugin,
            engineDir: resolveHermesPath(packageManager),
        },
    });

    return proc.error;
}

export function resolveHermesPath(packageManager: string) {
    if (packageManager === 'pnpm') {
        const hermesPath = glob(
            'node_modules/.pnpm/@aliucord+hermesc@*/node_modules/@aliucord/hermesc'
        )[0];

        if (!hermesPath) {
            logger.error(
                `Hermes engine not found. Are you sure you have installed all of the dependencies using PNPM?`
            );
            process.exit(1);
        }

        return hermesPath;
    } else return 'node_modules/@aliucord/hermesc';
}

export const SupportedPackageManagers = ['npm', 'pnpm', 'yarn'];
