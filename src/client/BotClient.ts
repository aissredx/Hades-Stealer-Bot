import fs from 'fs';
import path from 'path';
import { Telegraf, Context } from 'telegraf';
import { getMessageText } from '../utils/message';
import Command from '../structures/Command';
import Event from '../structures/Event';
import * as config from '../config';

export default class BotClient {
    public bot: Telegraf<Context>;
    public commands: Command[] = [];
    public events: Event[] = [];
    isBuilding: boolean = false;

    constructor(token?: string) {
        const t = token ?? config.TOKEN;
        if (!t) throw new Error('TOKEN missing in config.ts or constructor');
        this.bot = new Telegraf(t, config.BOT_OPTIONS as any);
    }

    public async init() {
        await this.loadCommands(config.COMMANDS_DIR);
        await this.loadEvents(config.EVENTS_DIR);
        this.registerTextPrefixHandler();
    }

    private async loadCommands(dir: string) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        for (const file of files) {
            const full = path.join(dir, file);
            const mod = require(full);
            const CommandClass = mod.default ?? mod;
            if (!CommandClass) continue;
            const instance: Command = new CommandClass();
            (instance as any).botClient = this;
            this.commands.push(instance);
            instance.register(this.bot, this);
            (this.bot as any).command(instance.name, (ctx: Context) => {
                (ctx.telegram as any).botClient = this;
                (ctx as any).commands = this.commands;
                (ctx as any).botClient = this;
                return instance.execute(ctx, this);
            });

        }
    }

    private async loadEvents(dir: string) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
        for (const file of files) {
            const full = path.join(dir, file);
            const mod = require(full);
            const EventClass = mod.default ?? mod;
            if (!EventClass) continue;
            const instance: Event = new EventClass();
            this.events.push(instance);
            instance.register(this.bot);
        }
    }

    private registerTextPrefixHandler() {
        this.bot.on('text', (ctx: any) => {
            const txt = getMessageText(ctx as Context) as string | undefined;
            if (!txt) return;
            if (!txt.startsWith(config.PREFIX)) return;
            const without = txt.slice(config.PREFIX.length).trim();
            const [cmdName, ...args] = without.split(/\s+/);
            const cmd = this.commands.find(c => c.name === cmdName);
            if (cmd) {
                (ctx.telegram as any).botClient = this;

                (ctx as any).commands = this.commands;
                (ctx as any).botClient = this;
                (ctx as any).args = args;
                cmd.execute(ctx);
            }
        });
    }

    public start() {
        this.bot.launch();
        console.log('Bot started');
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }
}
