import { Context } from 'telegraf';

export function getMessageText(ctx: Context): string | undefined {
    try {
        const msg: any = (ctx as any).message ?? (ctx as any).editedMessage ?? null;
        if (!msg) return undefined;
        if (typeof msg.text === 'string') return msg.text;
        if (typeof msg.caption === 'string') return msg.caption;
        return undefined;
    } catch (e) {
        return undefined;
    }
}

export default getMessageText;
