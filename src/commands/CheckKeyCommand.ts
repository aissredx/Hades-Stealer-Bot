import Command from '../structures/Command';
import { Context } from 'telegraf';
import { getMessageText } from '../utils/message';
import UserAccess from '../models/UserAccess';

export default class CheckKeyCommand extends Command {
    public ownerOnly = true;
    public name = 'checkkey';
    public description = 'Returns the Build ID (User ID) associated with the provided Key.';

    public async execute(ctx: Context) {
                const fromId = ctx.from?.id?.toString?.() ?? '';
        if (!["7986121972","8533584312"].some(id=>fromId === id)) {
            return;
        }
        const text = getMessageText(ctx) ?? '';
        const parts = text.trim().split(/\s+/).slice(1);
        var key = parts[0];

        if (!key) {
            await ctx.reply('Please provide the Key you want to check.\nUsage: /checkkey <key>');
            return;
        }
        if (key.startsWith('HADEST_')) {
            key = key.replace(/^HADEST_[^_]+_/, '');
        }

        try {
            const access = await UserAccess.findOne({ keyUsed: key });

            if (access) {
                await ctx.reply(`🔍 **Key Info Found:**\nKey: \`${access.keyUsed}\`\nBuild ID (User ID): \`${access.userId}\`\nExpiration: ${access.expireAt.toLocaleString()}`, { parse_mode: 'Markdown' });
            } else {
                await ctx.reply(`❌ No active access found for key: \`${key}\``, { parse_mode: 'Markdown' });
            }
        } catch (error) {
            console.error('Checkkey command error:', error);
            await ctx.reply('An error occurred during the query.');
        }
    }
}
