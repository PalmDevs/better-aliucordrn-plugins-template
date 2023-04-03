import { Plugin } from 'aliucord/entities';
import { MessageActions } from 'aliucord/metro';
import { ApplicationCommandOptionType } from 'aliucord/api';

export default class ExamplePlugin extends Plugin {
    public override async start() {
        this.commands.registerCommand({
            name: 'send',
            description: 'Sends a message to the current channel.',
            options: [
                {
                    name: 'content',
                    description: 'The message content to send',
                    type: ApplicationCommandOptionType.STRING,
                    required: true,
                },
            ],
            execute: (args, ctx) => {
                MessageActions.sendMessage(ctx.channel.id, {
                    content: args[0].value,
                });
            },
        });
    }
}
