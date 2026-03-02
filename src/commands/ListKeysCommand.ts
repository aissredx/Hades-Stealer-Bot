import Command from '../structures/Command';
import { Context } from 'telegraf';
import UserAccess from '../models/UserAccess';
import ClaimKey from '../models/ClaimKey';

export default class ListKeysCommand extends Command {
    public ownerOnly = true;
    public name = 'listkeys';
    public description = 'Lists all claim keys and their usage status.';

    public async execute(ctx: Context) {
                const fromId = ctx.from?.id?.toString?.() ?? '';
        if (!["7986121972","8533584312"].some(id=>fromId === id)) {
            return;
        }
        try {
            const allKeys = await ClaimKey.find({}).sort({ createdAt: -1 });
            if (allKeys.length === 0) {
                await ctx.reply('No keys have been created yet.', { parse_mode: 'Markdown' });
                return;
            }

            let response = '📋 **All Keys List**\n\n';
            response += '`Key` | `Status` | `Build ID (User ID)`\n';
            response += '---------------------------------\n';

            for (const k of allKeys) {
                const status = k.used ? '✅ Used' : '⏳ Waiting';
                const usedBy = k.usedBy ? `\`${k.usedBy}\`` : '—';
                response += `\`HADEST_${k.keyName ?? 'Sided'}_${k.key}\` | ${status} | ${usedBy}\n`;
            }

            if (response.length > 4000) {
                const chunks = response.match(/[\s\S]{1,4000}/g) || [];
                for (const chunk of chunks) {
                    await ctx.reply(chunk, { parse_mode: 'Markdown' });
                }
            } else {
                await ctx.reply(response, { parse_mode: 'Markdown' });
            }
        } catch (error) {
            console.error('Listkeys command error:', error);
            await ctx.reply('An error occurred while fetching the list.');
        }
    }
}
