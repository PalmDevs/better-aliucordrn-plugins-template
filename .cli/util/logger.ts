import chalk from 'chalk';
import ConsolePrefixes from '../constants/ConsolePrefixes.js';

function createLogMessage(
    prefix: keyof typeof ConsolePrefixes,
    message: string
) {
    return `${ConsolePrefixes[prefix]} ${message}`;
}

const debug = (message: string) =>
    process.env['CLI_DEBUG'] && console.debug(chalk.blackBright(message));
const log = (message: string) => console.log(message);
const info = (message: string) =>
    console.info(createLogMessage('Info', message));
const warn = (message: string) =>
    console.warn(createLogMessage('Warn', message));
const error = (message: string) =>
    console.error(createLogMessage('Error', message));
const newLine = (type: 'log' | 'info' | 'warn' | 'error' = 'log') =>
    console[type]('');

export default {
    debug,
    log,
    info,
    warn,
    error,
    newLine,
};
