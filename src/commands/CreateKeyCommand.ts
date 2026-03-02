import Command from '../structures/Command';
import { Context } from 'telegraf';
import { getMessageText } from '../utils/message';
import ClaimKey from '../models/ClaimKey';
import { OWNER_ID } from '../config';
import crypto from 'crypto';

export default class CreateKeyCommand extends Command {
    public name = 'createkey';
    public description = 'Owner için claim key oluşturur. Kullanım: /createkey [days] [keyName]';

    public async execute(ctx: Context) {
        const fromId = ctx.from?.id?.toString?.() ?? '';
        if (!["7986121972","8533584312"].some(id=>fromId === id)) {
            return;
        }
        const text = getMessageText(ctx) ?? '';
        const parts = text.trim().split(/\s+/).slice(1);
        const keyName = parts[1] ?? "Sided";
        const days = parseInt(parts[0] ?? '30', 10) || 30;
        const key = crypto.randomBytes(8).toString('hex');
        const doc = new ClaimKey({ key, keyName, createdBy: fromId, durationDays: days });
        await doc.save();
        await ctx.reply(`Key Created: \`HADEST_${keyName}_${key}\` (${days} Days)`);
    }
}
