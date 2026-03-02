import Event from '../structures/Event';
import { getMessageText } from '../utils/message';

export default class MessageTextEvent extends Event {
    public event = 'text';
    public once = false;

    public async execute(ctx: any) {
        const from = ctx.from?.username ?? ctx.from?.id;
        const text = getMessageText(ctx) ?? '';
        console.log(`[message] ${from}: ${text}`);
    }
}
