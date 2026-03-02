import Command from '../structures/Command';
import { Context } from 'telegraf';
import { getMessageText } from '../utils/message';
import UserAccess from '../models/UserAccess';

export default class WebhookCommand extends Command {
    public name = 'webhook';
    public description = 'Save/display Webhook URL.';

    public async execute(ctx: Context) {
        const userId = ctx.from?.id?.toString?.();
        const text = getMessageText(ctx) ?? '';
        const parts = text.trim().split(/\s+/).slice(1);
        const url = parts[0];
        if (!userId) return;

        const access = await UserAccess.findOne({ userId });
        if (!access) {
            await ctx.reply('First, you must gain access. Use /claim <key> with a key.');
            return;
        }

        if (!url) {
            if (access.webhook) await ctx.reply(`Registered webhook: ${access.webhook}`);
            else await ctx.reply('No webhooks are registered. To add a new webhook: /webhook <url>');
            return;
        }

        access.webhook = url;
        await access.save();
        await ctx.reply('Webhook Url saved.');
    }
}
