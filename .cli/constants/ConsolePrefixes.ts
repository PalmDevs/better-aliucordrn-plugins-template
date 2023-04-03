import chalk from 'chalk';

export default {
    Error: chalk.bgRed.whiteBright(' ERROR '),
    Warn: chalk.bgYellow.black(' WARN '),
    Info: chalk.bgBlue.whiteBright(' INFO '),
} as const;
