import chalk from 'chalk';
import logger from './logger.js';
import pkg from '../../package.json' assert { type: 'json' };
import type { program as Program } from '@commander-js/extra-typings';
import type CLIContext from '../types/CLIContext.js';

export default function createHelpHandler(
    program: typeof Program,
    context: CLIContext
) {
    logger.debug('Help handler is requested');
    return (command?: string) => {
        const { commands } = program;

        logger.debug(`There are ${commands.length} commands`);

        console.log(
            `${chalk.greenBright('AliuPlugRN CLI')} ${chalk.yellow(
                `v${pkg.version}`
            )}\n${program.description()}\n`
        );

        if (!command) {
            logger.debug('No command specified, printing help for the program');

            console.log(
                `${chalk.cyan('Usage:')} ${
                    context.packageManager
                } run cli -- ${program.usage()}\n`
            );

            const helper = program.createHelp();
            const programOpts = helper.visibleOptions(program);
            const programOptsStr = programOpts
                .map(
                    opt =>
                        ` - ${opt.flags
                            .split(',')
                            .map(flag => chalk.yellow(flag.trim()))
                            .join(', ')} - ${opt.description}`
                )
                .join('\n');

            console.log(
                `${chalk.cyan('Options:')}\n` +
                    `${programOptsStr}\n\n` +
                    `${chalk.cyan('Commands:')}\n` +
                    `${commands
                        .map(
                            command =>
                                ` - ${chalk.yellow(
                                    command.name()
                                )} ${command.usage()} - ${command.description()}`
                        )
                        .join('\n')}`
            );
        } else {
            logger.debug(`Command ${command} specified, printing help for it`);

            const cmd = commands.find(c => c.name() === command);
            if (!cmd) {
                logger.error(`Command ${chalk.yellow(cmd)} not found.`);
                process.exit(1);
            }

            const helper = program.createHelp();
            const cmdArgs = helper
                .visibleArguments(cmd)
                .map(
                    arg => ` - ${chalk.yellow(arg.name())} - ${arg.description}`
                )
                .join('\n');
            const cmdOpts = helper
                .visibleOptions(cmd)
                .map(
                    opt =>
                        ` - ${opt.flags
                            .split(',')
                            .map(flag => chalk.yellow(flag.trim()))
                            .join(', ')} - ${opt.description}`
                )
                .join('\n');

            console.log(
                `${chalk.cyan('Usage:')} ${
                    context.packageManager
                } run cli -- ${cmd.name()} ${cmd.usage()}\n\n` +
                    `${chalk.cyan('Description:')} ${cmd.description()}\n\n` +
                    `${chalk.cyan('Arguments:')}\n` +
                    `${cmdArgs}\n\n` +
                    `${chalk.cyan('Options:')}\n` +
                    `${cmdOpts}`
            );
        }
    };
}
