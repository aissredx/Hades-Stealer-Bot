import BotClient from './client/BotClient';
import { connectMongo } from './database/mongo';
import startApi from './api/Server';
import { MONGO_URI } from './config';
import dcMarkdown from "discord-bettermarkdown"
async function main() {
    try {
        if (MONGO_URI) await connectMongo();

        const client = new BotClient();
        await client.init();

        startApi(client.bot);

        client.start();
    } catch (err) {
        console.error('Başlatma hatası:', err);
        process.exit(1);
    }
}

main();
