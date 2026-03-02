import Command from '../structures/Command';
import { Context } from 'telegraf';
import { getMessageText } from '../utils/message';
import ClaimKey from '../models/ClaimKey';
import UserAccess from '../models/UserAccess';

function msToTime(ms: number) {
    const days = Math.floor(ms / (24 * 3600 * 1000));
    const hrs = Math.floor((ms % (24 * 3600 * 1000)) / (3600 * 1000));
    const mins = Math.floor((ms % (3600 * 1000)) / (60 * 1000));
    return `${days} gün ${hrs} saat ${mins} dakika`;
}

export default class ClaimCommand extends Command {
    public name = 'claim';
    public description = 'Access is granted with the claim key or existing access is displayed..';

    public async execute(ctx: Context) {
        const userId = ctx.from?.id?.toString?.();
        const text = getMessageText(ctx) ?? '';
        const parts = text.trim().split(/\s+/).slice(1);
        var key = parts[0];

        if (!userId) return;

        if (!key) {
            const access = await UserAccess.findOne({ userId });
            if (!access) {
                await ctx.reply('You do not have active access. You can use /claim <key> with a claim key.');
                return;
            }
            const now = new Date();
            const remaining = access.expireAt.getTime() - now.getTime();
            if (remaining <= 0) {
                await ctx.reply('Your access has expired. You can claim it again with a new key.');
                return;
            }
            await ctx.reply(`Access information:\nStart: ${access.startAt.toLocaleString()}\nEnd: ${access.expireAt.toLocaleString()}\nTime remaining: ${msToTime(remaining)}`);
            return;
        }
        key = key.replace(/^HADEST_[^_]+_/, '');
        const keyDoc = await ClaimKey.findOne({ key });
        if (!keyDoc) {
            await ctx.reply('Invalid key.');
            return;
        }
        if (keyDoc.used) {
            await ctx.reply('This key has already been used.');
            return;
        }

        const now = new Date();
        const expire = new Date(now.getTime() + keyDoc.durationDays * 24 * 3600 * 1000);
        await UserAccess.findOneAndUpdate(
            { userId },
            { userId, keyUsed: key, keyName: keyDoc.keyName, startAt: now, expireAt: expire },
            { upsert: true }
        );
        keyDoc.used = true;
        keyDoc.usedBy = userId;
        keyDoc.usedAt = now;
        await keyDoc.save();

        await ctx.reply(`Congratulations! Access granted. Duration: ${keyDoc.durationDays} days. Expiration: ${expire.toLocaleString()}`);
    }
}
