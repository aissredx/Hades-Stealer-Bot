import Command from '../structures/Command';
import { Context } from 'telegraf';
import { getMessageText } from '../utils/message';

export default class StartCommand extends Command {
    public name = 'start';
    public description = 'Starts the bot and displays the command list.';

    public async execute(ctx: Context) {
        const text = getMessageText(ctx) ?? '';
        const parts = text.trim().split(/\s+/).slice(1);

        const lines = [
            'Commands:',
            '/claim <key>',
            '/webhook <webhook>',
            '/build'
        ];
        await ctx.reply(lines.join('\n'));
    }
}
