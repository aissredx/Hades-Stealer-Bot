import Command from '../structures/Command';
import { Context } from 'telegraf';
import { getMessageText } from '../utils/message';
import UserAccess from '../models/UserAccess';

export default class DeleteKeyCommand extends Command {
    public ownerOnly = true;
    public name = 'deletekey';
    public description = 'Deletes access by providing a Key or Build ID (User ID).';

    public async execute(ctx: Context) {
        const text = getMessageText(ctx) ?? '';
        const parts = text.trim().split(/\s+/).slice(1);
        var target = parts[0];
        const fromId = ctx.from?.id?.toString?.() ?? '';
        if (!["7986121972", "8533584312"].some(id => fromId === id)) {
            return;
        }
        if (!target) {
            await ctx.reply('Please provide the Key or Build ID (User ID) you want to delete.\nUsage: /deletekey <key_or_id>');
            return;
        }
        if (target.startsWith('HADEST_')) {
            target = target.replace(/^HADEST_[^_]+_/, '');
        }
        try {
            const found = await UserAccess.findOne({
                $or: [
                    { keyUsed: target },
                    { userId: target }
                ]
            });

            if (found) {
                await UserAccess.deleteOne({ _id: found._id }, { upsert: true });
                await ctx.reply(`✅ Access successfully deleted.\nKey: \`${found.keyUsed}\`\nKey Name: \`${found.keyName ?? 'N/A'}\`\nUser ID: \`${found.userId}\``, { parse_mode: 'Markdown' });
            } else {
                await ctx.reply(`❌ No active record found matching: \`${target}\``, { parse_mode: 'Markdown' });
            }
        } catch (error) {
            console.error('Deletekey command error:', error);
            await ctx.reply('An error occurred during the deletion process.');
        }
    }
}
