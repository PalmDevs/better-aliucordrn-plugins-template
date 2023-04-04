import { Command, Option } from '@commander-js/extra-typings';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { lstatSync, readdirSync } from 'fs';
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

const plugins = readdirSync('./plugins')
    .filter(plugin => lstatSync(`./plugins/${plugin}`).isDirectory())
    .map(plugin => {
        const nodes = readdirSync(`./plugins/${plugin}`);
        const available =
            nodes.includes('package.json') &&
            nodes.includes('index.ts') &&
            lstatSync(`./plugins/${plugin}/index.ts`).isFile() &&
            lstatSync(`./plugins/${plugin}/package.json`).isFile();

        logger.debug(
            `Plugin ${plugin} is loaded, it is ${
                available ? 'available' : 'not available'
            }`
        );

        if (!available)
            logger.warn(
                `The plugin ${chalk.yellow(
                    plugin
                )} is invalid. It may be missing the ${chalk.yellow(
                    'package.json'
                )} file or the ${chalk.cyan('index.ts')} file.\n`
            );

        return {
            name: plugin,
            available,
        };
    });

context.plugins = plugins;
logger.debug(`Successfully loaded ${context.plugins.length} plugin(s)`);

// Setup CLI

const program = new Command('aliuplugrn-cli')
    .version(pkg.version, '-v, --version', 'Display the current version')
    .description('A CLI for AliucordRN plugins development');

const handleHelp = createHelpHandler(program, context);

program
    .option('--remove-semrel-packages', 'Remove semantic-release packages')
    .addOption(
        new Option('--remove-pm-junk', 'Remove package manager junk files')
            .hideHelp()
            .conflicts('--remove-semrel-packages')
    )
    .action(options => {
        const { removePmJunk, removeSemrelPackages } = options;

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
                        `Cannot spawn command to uninstall semantic-release packages`
                    ),
                    logger.debug(err.toString()),
                    process.exit(1)
                )
            );
            proc.once('exit', code => {
                logger.newLine();

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

        logger.debug('No options or commands passed, going to help page');
        if (!removePmJunk && !removeSemrelPackages) handleHelp();
    });

program
    .command('help')
    .description('Display help for a command')
    .argument('[command]', 'The command to display help for')
    .action(command => handleHelp(command));

Object.values(Commands).forEach(command => command(program, context));

program.parse();
