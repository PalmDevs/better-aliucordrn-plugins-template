import { program as Program } from '@commander-js/extra-typings';
import logger from '../util/logger.js';
import type CLIContext from '../types/CLIContext.js';
import formatPluginList from '../util/formatPluginList.js';

export default function List(program: typeof Program, context: CLIContext) {
    return program
        .command('list')
        .description('Lists all plugins')
        .action(async () => {
            const { plugins: pluginObjects } = context;
            const [unavailablePlugins, availablePlugins] = [
                pluginObjects.filter(p => !p.available).map(p => p.name),
                pluginObjects.filter(p => p.available).map(p => p.name),
            ];

            logger.log(formatPluginList(availablePlugins, unavailablePlugins));
        });
}
