import { Telegraf, Context } from 'telegraf';

export default abstract class Command {
    public abstract name: string;
    public abstract description?: string;

    constructor() { }

    public abstract execute(ctx: Context, client?: any): Promise<void> | void;

    public register(bot: Telegraf<Context>, client?: any): void { }
}

