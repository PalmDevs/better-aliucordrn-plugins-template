import chalk from 'chalk';

export default function formatPluginList(
    availablePlugins: string[],
    unavailablePlugins: string[]
) {
    let output = '';

    if (availablePlugins.length)
        output = output.concat(
            `${chalk.cyan('Available plugins')}:\n` +
                `${availablePlugins.map(plugin => ` - ${plugin}`).join('\n')}`
        );

    if (unavailablePlugins.length) {
        if (availablePlugins.length) output = output.concat('\n\n');
        output = output.concat(
            `${chalk.cyan('Unavailable plugins:')}\n` +
                `${unavailablePlugins
                    .map(plugin => ` - ${chalk.gray(plugin)}`)
                    .join('\n')}`
        );
    }

    return output;
}
