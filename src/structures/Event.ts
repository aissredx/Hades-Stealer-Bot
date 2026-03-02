import { Telegraf } from 'telegraf';

export default abstract class Event {
    public abstract event: string;
    public abstract once?: boolean;

    constructor() { }

    public abstract execute(ctx: any): Promise<void> | void;

    public register(bot: Telegraf<any>) {
        if (this.once) {
            (bot as any).once(this.event as any, (ctx: any) => this.execute(ctx));
        } else {
            (bot as any).on(this.event, (ctx: any) => this.execute(ctx));
        }
    }
}
