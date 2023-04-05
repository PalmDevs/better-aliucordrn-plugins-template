import { Command, Option } from '@commander-js/extra-typings';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { lstatSync, readdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import SemanticReleasePackages from './constants/SemanticReleasePackages.js';
import { SupportedPackageManagers } from './commands/build.js';
import * as Commands from './commands/index.js';
import createHelpHandler from './util/createHelpHandler.js';
import {
    move as moveJunk,
    restore as restoreJunk,
} from './util/packageManagerJunk.js';
import logger from './util/logger.js';
import pkg from '../package.json' assert { type: 'json' };
import type CLIContext from './types/CLIContext.js';
import pascalCaseToKebabCase from './util/pascalCaseToKebabCase.js';

if (dirname(process.cwd()) === dirname(fileURLToPath(import.meta.url))) {
    logger.error(
        `You can't run the CLI from the ${chalk.cyan(
            '.cli'
        )} directory. Please run it from the root directory of the project.`
    );
    process.exit(1);
}

// 🛑 If you're looking to modify the default package manager, this is the place to do it!
// Example: const defaultPackageManager = 'npm';
const defaultPackageManager = '';

const npmUserAgent = process.env['npm_config_user_agent'] ?? 'npm';
const context: CLIContext = {
    packageManager: npmUserAgent.startsWith('npm')
        ? 'npm'
        : npmUserAgent.startsWith('yarn')
        ? 'yarn'
        : npmUserAgent.startsWith('pnpm')
        ? 'pnpm'
        : defaultPackageManager || (npmUserAgent.split('/')[0] ?? ''),
    plugins: [],
};

logger.debug(
    'Initialized CLI with arguments\n' +
        process.argv.map(arg => ` - ${arg}`).join('\n')
);
logger.debug(
    `Package manager is ${context.packageManager} (default: "${defaultPackageManager}", user agent: "${npmUserAgent}")`
);

// Load plugins

const packageNamePlugins = new Map<string, string[]>();
const plugins = await Promise.all(
    readdirSync('./plugins')
        .filter(plugin => lstatSync(`./plugins/${plugin}`).isDirectory())
        .sort((a, b) => a.localeCompare(b))
        .map(async plugin => {
            const nodes = readdirSync(`./plugins/${plugin}`);
            const isAvailable =
                nodes.includes('manifest.json') &&
                nodes.includes('index.ts') &&
                lstatSync(`./plugins/${plugin}/index.ts`).isFile() &&
                lstatSync(`./plugins/${plugin}/manifest.json`).isFile();

            logger.debug(
                `Plugin ${plugin} is loaded, it is ${
                    isAvailable ? 'available' : 'not available'
                }`
            );

            !nodes.includes('CHANGELOG.md') &&
                logger.warn(
                    `The plugin ${chalk.yellow(
                        plugin
                    )} does not have a CHANGELOG.md file. It is recommended to have this file.`
                );

            !nodes.includes('README.md') &&
                logger.warn(
                    `The plugin ${chalk.yellow(
                        plugin
                    )} does not have a README.md file. It is recommended to have this file.`
                );

            if (!isAvailable)
                logger.warn(
                    `The plugin ${chalk.yellow(
                        plugin
                    )} is invalid. It may be missing the ${chalk.yellow(
                        'manifest.json'
                    )} file or the ${chalk.cyan('index.ts')} file.`
                );

            return {
                name: plugin,
                available: isAvailable,
            };
        })
);

logger.newLine();

context.plugins = plugins;

logger.debug(`Successfully loaded ${context.plugins.length} plugin(s)`);

// Setup CLI

const program = new Command('aliuplugrn-cli')
    .version(pkg.version, '-v, --version', 'Display the current version')
    .description('A CLI for AliucordRN plugins development');

const handleHelp = createHelpHandler(program, context);

program
    .addOption(
        new Option(
            '--remove-semrel-packages',
            'Remove semantic-release packages'
        )
            .hideHelp()
            .conflicts('--remove-pm-junk')
            .conflicts('--create-imaginary-package-json')
    )
    .addOption(
        new Option('--remove-pm-junk', 'Remove package manager junk files')
            .hideHelp()
            .conflicts('--remove-semrel-packages')
            .conflicts('--create-imaginary-package-json')
    )
    .addOption(
        new Option(
            '--create-imaginary-package-json',
            'Creates imaginary JSON file for the CI to function properly'
        )
            .hideHelp()
            .conflicts('--remove-pm-junk')
            .conflicts('--remove-semrel-packages')
    )
    .action(options => {
        const {
            removePmJunk,
            removeSemrelPackages,
            createImaginaryPackageJson,
        } = options;

        logger.debug(
            'Options passed\n' +
                Object.entries(options)
                    .map(([key, value]) => ` - ${key}: ${value}`)
                    .join('\n')
        );

        if (removePmJunk) {
            restoreJunk(context.packageManager);
            logger.debug(`Restoring junk for ${context.packageManager}`);

            SupportedPackageManagers.filter(
                pm => pm !== context.packageManager
            ).forEach(
                pm => (moveJunk(pm), logger.debug(`Removing junk for ${pm}`))
            );

            logger.info(
                `You are currently running ${chalk.cyanBright(
                    context.packageManager
                )}. Other package manager's files have been moved for compatibility. You can restore them by using one of those package managers.`
            );

            process.exit(0);
        }

        if (removeSemrelPackages) {
            logger.info('Uninstalling semantic-release packages...');

            const proc = spawn(
                context.packageManager,
                ['uninstall', ...SemanticReleasePackages],
                { stdio: 'inherit' }
            );

            proc.on('spawn', () =>
                logger.debug(
                    'Spawned semantic-release packages uninstallation process'
                )
            );
            proc.on('message', msg => console.log(msg));
            proc.once(
                'error',
                err => (
                    logger.error(
                        `Cannot spawn process to uninstall semantic-release packages`
                    ),
                    logger.debug(err.toString()),
                    process.exit(1)
                )
            );
            proc.once('exit', code => {
                logger.newLine('error');

                if (code === null) {
                    logger.error(
                        `Failed to uninstall semantic-release packages with ${chalk.redBright(
                            'no error code'
                        )}.`
                    );
                    process.exit(1);
                } else if (code) {
                    logger.error(
                        `Failed to uninstall semantic-release packages with ${chalk.redBright(
                            `error code ${code}`
                        )}.`
                    );
                    process.exit(code);
                } else
                    logger.info(
                        'Uninstalled all semantic-released related packages successfully.'
                    );
            });

            process.exit(0);
        }

        if (createImaginaryPackageJson) {
            logger.info('Creating imaginary package.json file for plugins...');

            logger.newLine('info');

            const availablePlugins = plugins.filter(plugin => plugin.available);
            if (!availablePlugins.length)
                logger.error('No plugins available'), process.exit(1);

            for (const plugin of availablePlugins) {
                logger.info(
                    `Creating imaginary package.json for plugin ${chalk.yellow(
                        plugin.name
                    )}...`
                );

                writeFileSync(
                    `./plugins/${plugin.name}/package.json`,
                    JSON.stringify({
                        name: pascalCaseToKebabCase(plugin.name),
                    })
                );
            }

            process.exit(0);
        }

        logger.debug('No options or commands passed, going to help page');
        if (!removePmJunk && !removeSemrelPackages) handleHelp();

        // Tell users for duplicate package names plugins, this comes after because it needs to be noticed
        Array.from(packageNamePlugins)
            .filter(([_, plugins]) => plugins.length > 1)
            .forEach(([packageName, plugins]) => {
                logger.newLine('error');
                logger.error(
                    `The package name ${chalk.yellow(
                        packageName
                    )} is used by multiple plugins. One or more of following plugins need to be modified:\n` +
                        plugins
                            .map(plugin => chalk.yellow(` - ${plugin}`))
                            .join('\n')
                );
            });
    });

program
    .command('help')
    .description('Display help for a command')
    .argument('[command]', 'The command to display help for')
    .action(command => handleHelp(command));

Object.values(Commands).forEach(command => command(program, context));

program.parse();
