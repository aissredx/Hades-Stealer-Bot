# Hadestealer Bot - Comprehensive Technical Summary

## Overview

**Hadestealer Bot** is a Telegram-based command and control (C&C) bot system designed to manage malware builds, track user access via claim keys, and aggregate stolen data from infected systems. The bot provides build customization, webhook integration for Discord notifications, and a REST API for receiving data from deployed malware instances.

**Technology Stack:**
- **Runtime:** Node.js (TypeScript)
- **Framework:** Telegraf (Telegram Bot API wrapper)
- **Database:** MongoDB
- **Web Framework:** Express.js
- **Build System:** Electron (for packaged builds)

---

## Architecture Overview

### High-Level Flow

```
Telegram User
    ↓
BotClient (Telegraf Instance)
    ├── Commands (CLI-style operations)
    ├── Events (Message logging)
    └── Prefix Handler (! prefix parsing)
         ↓
    Database (MongoDB)
         ↓
Express API Server (Port 3000)
    ├── Receives data from malware builds
    ├── Logs upload records
    └── Notifies Discord webhooks
         ↓
    Discord Webhook
         ↓
    User's Discord Server
```

### Core Components

1. **BotClient** (`src/client/BotClient.ts`)
   - Initializes Telegraf bot instance
   - Dynamically loads all commands from `src/commands/`
   - Dynamically loads all events from `src/events/`
   - Registers prefix-based command handler (`!` prefix)
   - Manages bot lifecycle (start, stop)

2. **MongoDB Connection** (`src/database/mongo.ts`)
   - Establishes mongoose connection
   - Uses connection string from `MONGO_URI` config

3. **Express API Server** (`src/api/Server.ts`)
   - RESTful endpoints for data collection from malware
   - Rate limiting (150 requests per window)
   - IP-based blacklist filtering
   - File upload handling with multer
   - Webhook forwarding to Discord

4. **Entry Point** (`src/index.ts`)
   - Connects to MongoDB
   - Initializes BotClient
   - Starts Express API server
   - Launches Telegram bot

---

## Configuration (`src/config.ts`)

### Required Constants

| Variable | Type | Purpose | Security Note |
|----------|------|---------|---|
| `TOKEN` | string | Telegram Bot API token | **EXPOSED - hardcoded** |
| `PREFIX` | string | Command prefix (default: `!`) | User command activation |
| `OWNER_ID` | string | Owner's Telegram user ID | Admin operations |
| `GOFILE_SETTINGS` | object | GoFile.io upload credentials | File hosting for builds |
| `MONGO_URI` | string | MongoDB connection string | **EXPOSED - hardcoded** |
| `BASE_WEBHOOK_URL` | string | Discord webhook URL | **EXPOSED - hardcoded** |
| `API_PORT` | number | Express server port (default: 3000) | API listening port |
| `WEBHOOK_FORWARD_DELAY_MS` | number | Delay before forwarding to user webhook (10s) | Async notification |

### Emoji Configuration
Custom Discord emojis for badge display (70+ emoji mappings for Discord user badges, boost tiers, etc.)

**Critical Security Issues:**
- API tokens and credentials hardcoded in source
- Should use environment variables via `.env` file

---

## Database Models

### 1. **UserAccess** (`src/models/UserAccess.ts`)

Tracks user access and build configuration.

```typescript
{
  userId: string (unique),           // Telegram user ID
  keyUsed: string,                   // Claim key used to gain access
  keyName: string,                   // Name assigned to the key
  startAt: Date,                     // Access start time
  expireAt: Date,                    // Access expiration time
  webhook: string,                   // Discord webhook for data forwarding
  build: {
    name: string,                    // Executable file name
    version: string,                 // Version number
    productName: string,             // Product name in PE metadata
    fileDescription: string,         // File description in PE metadata
    company: string,                 // Author/Company in PE metadata
    legalCopyright: string,          // Copyright info
    icon: string,                    // Icon file name
    theme: string,                   // Loading theme (optional)
    key: string[]                    // Array of API keys assigned to builds
  }
}
```

**Purpose:** Central user profile; tracks access validity, webhook destination, and build preferences.

---

### 2. **ClaimKey** (`src/models/ClaimKey.ts`)

Represents access keys that users claim to gain bot access.

```typescript
{
  key: string (unique),              // Random hex key (generated from crypto.randomBytes)
  keyName: string,                   // Label (e.g., "Sided", "Premium")
  createdBy: string,                 // Creator's user ID
  createdAt: Date,                   // Creation timestamp
  durationDays: number,              // Access duration in days (default: 30)
  used: boolean,                     // Whether key has been claimed
  usedBy: string,                    // User ID who claimed it
  usedAt: Date                       // Claim timestamp
}
```

**Purpose:** One-time access tokens; prevent duplicate usage, track key distribution.

---

### 3. **UploadRecord** (`src/models/UploadRecord.ts`)

Logs all data received from malware instances.

```typescript
{
  route: string,                     // API endpoint (/discord, /browser, /files, etc.)
  uploader: string,                  // User ID or identifier
  originalName: string,              // Original uploaded file name
  filePath: string,                  // Local storage path
  meta: any,                         // Route-specific metadata
    {
      method: string,
      path: string,
      ip: string,
      body: any,
      ts: Date,
      buildId: string,               // User ID that sent the data
      ...routeSpecific
    }
  createdAt: Date                    // Record timestamp
}
```

**Purpose:** Audit trail of all data collection events; supports data recovery and analysis.

---

## Commands

All commands are defined in `src/commands/` and loaded dynamically. Base class: `Command`.

### User-Accessible Commands

#### 1. **/claim** (`ClaimCommand.ts`)
**Description:** Claim access with a key or view existing access.

**Usage:**
- `/claim <key>` - Activate a claim key
- `/claim` - View current access status

**Behavior:**
- Validates claim key format (strips `HADEST_[name]_` prefix if present)
- Checks key hasn't been used
- Creates or updates `UserAccess` record
- Sets expiration based on key's `durationDays`
- Marks key as used

**Timezone:** Uses system locale for date display

---

#### 2. **/webhook** (`WebhookCommand.ts`)
**Description:** Register or view Discord webhook for data forwarding.

**Usage:**
- `/webhook <url>` - Save Discord webhook URL
- `/webhook` - Display registered webhook

**Behavior:**
- Requires active access (`UserAccess` record)
- Stores full webhook URL in `UserAccess.webhook`
- User must have valid access before registration

**Validation:** Only checks for existing `UserAccess`, not webhook validity

---

#### 3. **/build** (`BuildCommand.ts`)
**Description:** Interactive build customization and generation system.

**Usage:**
- `/build` - Main menu

**Interactive Workflow:**

1. **Main Menu** → Shows current build config, options:
   - 🚀 Start Building (compiles and packages)
   - ⚙️ Build Setup (configure settings)

2. **Config Menu** → Customize:
   - 📝 File Name (executable name)
   - 🏷️ Product Name (PE metadata)
   - 👤 Author (PE company field)
   - 📄 Description (PE file description)
   - 🖼️ Icon (upload .ico file)
   - 🎨 Theme (visual theme for loader)

3. **Icon Upload:**
   - Accepts `.ico` files only
   - Stores in `user_uploads/<userId>.ico`
   - Recommended: 256x256 pixels

4. **Build Execution:**
   - Checks build not already in progress (`client.isBuilding`)
   - Validates access not expired
   - Generates random API key (8 bytes hex) for build
   - Injects constants into `Stealer/src/config/constants.ts`:
     - `BUILD_ID = <userId>`
     - `THEME = <selected_theme>`
     - `API_KEY = <random_key>`
   - Updates `package.json` with build metadata
   - Executes `npm run package-electron` in Stealer directory
   - Uploads compiled `.exe` to GoFile.io
   - Returns download link to user
   - Shows progress percentage during upload

**Theme Options:**
- 2DGame, KittiesMC, Minecraft, NormalGame, VRChat, WatchTV
- Default: No loading screen

**Build Storage:**
- Looks for `Stealer/` directory in parent or ancestor paths
- Expects compiled output in `release/` subdirectory
- Naming: `{productName} Setup {version}.exe`

---

### Owner-Only Commands

These commands verify ownership by checking hardcoded user IDs: `7986121972` and `8533584312`

#### 4. **/createkey** (`CreateKeyCommand.ts`)
**Description:** Generate new claim keys (owner only).

**Usage:**
- `/createkey [days] [keyName]`

**Defaults:**
- `days = 30`
- `keyName = "Sided"`

**Process:**
- Generates 8-byte random hex key
- Creates `ClaimKey` document
- Returns formatted key: `HADEST_<keyName>_<key>`

**Example:**
```
/createkey 60 Premium
→ Key Created: `HADEST_Premium_a1b2c3d4e5f6g7h8` (60 Days)
```

---

#### 5. **/listkeys** (`ListKeysCommand.ts`)
**Description:** Display all created keys and their status.

**Output Format:**
```
📋 **All Keys List**

`Key` | `Status` | `Build ID (User ID)`
---------------------------------
`HADEST_Premium_abc123` | ✅ Used | `123456789`
`HADEST_Sided_def456` | ⏳ Waiting | —
```

**Columns:**
- **Key:** Formatted with prefix
- **Status:** ✅ Used or ⏳ Waiting
- **Build ID:** User ID if claimed, — if unused

---

#### 6. **/checkkey** (`CheckKeyCommand.ts`)
**Description:** Look up which user claimed a specific key.

**Usage:**
- `/checkkey <key>`

**Process:**
- Strips `HADEST_[name]_` prefix if present
- Queries `UserAccess` for matching key
- Returns `userId` and expiration if found

**Output:**
```
🔍 **Key Info Found:**
Key: `abc123def456`
Build ID (User ID): `123456789`
Expiration: 2/15/2025, 3:45:30 PM
```

---

#### 7. **/deletekey** (`DeleteKeyCommand.ts`)
**Description:** Revoke user access by key or user ID.

**Usage:**
- `/deletekey <key_or_userId>`

**Behavior:**
- Accepts either claim key or user ID
- Strips key prefix if needed
- Removes `UserAccess` document
- Returns confirmation with deleted info

---

#### 8. **/start** (`StartCommand.ts`)
**Description:** Display available commands.

**Output:**
```
Commands:
/claim <key>
/webhook <webhook>
/build
```

---

## Events

Events are loaded from `src/events/` and registered via abstract `Event` class.

### MessageTextEvent (`src/events/MessageTextEvent.ts`)

**Event Type:** `text`

**Behavior:**
- Logs all text messages to console
- Format: `[message] <username|userId>: <message>`
- Non-blocking; runs on every message

**Purpose:** Activity monitoring and debugging

---

## API Endpoints

**Base URL:** `http://localhost:3000`

**Authentication:** 
- Header: `API_KEY` (matches a key in user's `build.key` array)
- Header: `X-Build-ID` or `x-build-id` (Telegram user ID)
- Both must be valid; failure returns 403 with error message

**Rate Limiting:**
- 150 requests per window (2147483647 ms = ~24 days)
- Returns 429 with message `:D`

**IP Blacklist:**
- Blocks 9 hardcoded IPs with sarcastic response

### 1. **GET /health**
Returns basic health check.
```json
{ "ok": true }
```

---

### 2. **GET /status**
Check bot connection status.
```json
{ "ok": true, "bot": { "id": 123, "username": "..." } }
```

---

### 3. **POST /log**
Receive and log generic messages (appears twice in code).
```json
// Request
{ "message": "any log message" }

// Response
{ "ok": true }
```

**Storage:** Saves to `UploadRecord` with route `/log` and message in metadata.

---

### 4. **POST /discord**
Receive Discord user tokens, account info, and friends list.

```json
// Request
{
  "token": "string",
  "userInfo": {
    "id": "string",
    "username": "string",
    "email": "string",
    "avatar": "string",
    "mfa_enabled": boolean,
    "phone": "string",
    "badges": [{ "id": "string" }],
    "public_flags": number
  },
  "friends": [
    {
      "profile": { /* user info */ }
    }
  ]
}

// Response
{ "ok": true, "stored": { "tokenHash": "..." } }
```

**Processing:**
- Stores record in MongoDB
- Sends embed to Discord webhook with:
  - User avatar, badges, MFA status
  - Token (first 256 chars)
  - Email, phone number
  - Friends with important badges (Partner, BotDev, etc.)
- Forwards to user's personal webhook (if configured)

---

### 5. **POST /browser**
Receive browser data (cookies, passwords, etc.) as ZIP file.

```
// Request (multipart/form-data)
file: <zip file>
summary: "string" (optional)

// Response
{ "ok": true, "id": "<mongoId>" }
```

**Validation:**
- File must be `.zip`
- Deleted if extension invalid

**Processing:**
- Stores file on disk
- Creates `UploadRecord`
- Sends Discord notification with summary

---

### 6. **POST /exodus**
Receive Exodus wallet export files (ZIP).

```
// Request (multipart/form-data)
file: <zip file>
password: "string" (optional)

// Response
{ "ok": true, "id": "<mongoId>", "passwordStored": boolean }
```

**Processing:**
- Similar to `/browser`
- Optionally stores password hash
- Notifies webhook with wallet data

---

### 7. **POST /files**
Receive general file data (ZIP only).

```
// Request (multipart/form-data)
file: <zip file>
message: "string" (optional)

// Response
{ "ok": true, "id": "<mongoId>" }
```

---

### 8. **POST /capture**
Receive screenshot data as base64-encoded image.

```json
// Request
{
  "image": "base64string"
}

// Response
200 OK
```

**Processing:**
- Decodes base64 to PNG
- Creates Discord embed with image attachment
- Sends to Discord webhook
- Forwards to user's personal webhook

---

### 9. **POST /antivm**
Receive system information to detect sandboxing.

```json
// Request
{
  "data": {
    "username": "string",
    "hostname": "string",
    "cpus": "string",
    "arch": "string",
    "hwid": "string",
    "platform": "string"
  }
}

// Response
200 OK
```

**Discord Embed Fields:**
- 👤 Username, 🏷️ Hostname, 💻 Processor
- ⚙️ Architecture, 🔑 HWID, 🌍 System

---

### 10. **POST /collect**
Receive injectable data (credentials, 2FA, password changes, etc.).

```json
// Request
{
  "type": "TOKEN_GRABBED" | "PASSWORD_CHANGED" | "CREDENTIALS_CAPTURE" | "2FA_SETUP_SUCCESS",
  "user": "username",
  "data": {
    "token": "...",           // for TOKEN_GRABBED
    "old": "...",             // for PASSWORD_CHANGED
    "new": "...",
    "email": "...",           // for CREDENTIALS_CAPTURE
    "pass": "...",
    "secret": "..."           // for 2FA_SETUP_SUCCESS
  }
}

// Response
200 OK
```

**Embed Titles:**
- TOKEN_GRABBED: "Hadestealer TOKEN GRABBED"
- PASSWORD_CHANGED: "Hadestealer PASSWORD CHANGED"
- CREDENTIALS_CAPTURE: "Hadestealer CREDENTIALS CAPTURED"
- 2FA_SETUP_SUCCESS: "Hadestealer 2FA SETUP SUCCESS"

---

## Utility Functions

### 1. **getBadges** (`src/utils/getBadges.ts`)

Converts Discord badge IDs to custom emoji strings.

**Discord Badge Mappings:**
- **Badges:** Partner, Moderator, HypesquadEvents, Bug Hunters, Verified Developer, Early Supporter
- **Houses:** Bravery, Brilliance, Balance
- **Nitro Tiers:** Bronze, Silver, Gold, Platinum, Diamond, Emerald, Sapphire, Opal (with Turkish names)
- **Server Boosts:** 1mo–24mo boosts

**Function Signature:**
```typescript
getBadges(profile: any): string[]
```

Returns array of emoji strings matching user's badges.

---

### 2. **getMessageText** (`src/utils/message.ts`)

Extracts text from Telegraf message context.

```typescript
getMessageText(ctx: Context): string | undefined
```

**Logic:**
1. Checks `ctx.message?.text`
2. Falls back to `ctx.editedMessage?.text`
3. Falls back to `ctx.message?.caption` (for photos/documents)
4. Returns `undefined` if none found

**Used by:** All commands and prefix handler

---

### 3. **notifyWebhook** (`src/utils/notifyWebhook.ts`)

Formats and sends rich Discord embeds for various data types.

**Route Handlers:**

| Route | Embed Type | Purpose |
|-------|-----------|---------|
| `/discord` | User card | Discord account details |
| `/capture` | Screenshot | Screen capture with image |
| `/antivm` | System info | Machine details |
| `/inject` | Type-specific | Credentials/2FA/tokens |
| `/browser`, `/files`, `/exodus` | Data dump | File upload notifications |

**Special Features:**
- **Dynamic User Avatars:** Pulls from Discord CDN
- **Badge Emoji Display:** Uses `getBadges()` for visual representation
- **Friends Highlighting:** Identifies high-value targets (Partners, BotDevs) in friends list
- **Long Content Handling:** Splits large text across multiple embeds
- **File Attachments:** Adds uploaded files to Discord message
- **User Webhook Forwarding:** Calls `scheduleForward()` for secondary webhook

**Embed Structure:**
```typescript
{
  author: { name: "Hadestealer", icon_url: "..." },
  title: "Route-specific title",
  description: "Content preview",
  fields: [ { name, value, inline } ],
  footer: { text: "t.me/hadestealer | ID: ..." },
  timestamp: "ISO string"
}
```

---

### 4. **scheduleForward** (`src/utils/scheduleForward.ts`)

Delays and forwards data to user's personal Discord webhook.

```typescript
scheduleForward(
  embeds: any[],
  filePath?: string,
  ua?: IUserAccess,
  meta?: any,
  capture?: Buffer
): void
```

**Behavior:**
- Checks if user has valid access and personal webhook
- Waits `WEBHOOK_FORWARD_DELAY_MS` (10 seconds) before sending
- Handles three scenarios:
  1. **Screenshot:** Attaches image buffer
  2. **File:** Creates FormData with file stream
  3. **Data Only:** JSON payload without file

**Headers:** Form-Data or JSON Content-Type

**Purpose:** User-specific notifications for their own collected data

---

## Entry Point & Initialization (`src/index.ts`)

```typescript
async function main() {
  // 1. Connect to MongoDB
  await connectMongo();
  
  // 2. Initialize Telegram bot
  const client = new BotClient();
  await client.init();  // Loads commands and events
  
  // 3. Start Express API server
  startApi(client.bot);
  
  // 4. Launch Telegram bot polling
  client.start();
}
```

**Execution Order:**
1. Database connection (if `MONGO_URI` exists)
2. Command/event loading
3. Express server launch
4. Telegram polling

**Graceful Shutdown:**
- Listens for `SIGINT`/`SIGTERM`
- Stops bot polling on process termination

---

## Project Configuration Files

### package.json
**Dependencies:**
- `telegraf@4.12.3` - Telegram Bot API
- `express@4.18.2` - Web framework
- `mongoose@7.6.1` - MongoDB ODM
- `multer@2.0.2` - File uploads
- `archiver@7.0.1` - ZIP compression
- `rcedit@5.0.2` - Windows PE file editing
- `form-data@4.0.5` - Multipart requests
- `node-fetch@2.7.0` - HTTP requests
- `cors@2.8.5` - CORS middleware
- `express-rate-limit@8.2.1` - Rate limiting
- `sanitize-filename@1.6.3` - Safe file names
- `discord-bettermarkdown@2.1.1` - Markdown formatting
- `dotenv@16.3.1` - Environment variables

**Scripts:**
```json
{
  "build": "tsc",           // Compile TypeScript to dist/
  "start": "node dist/index.js",  // Run compiled version
  "dev": "ts-node src/index.ts"   // Run with ts-node
}
```

---

### tsconfig.json
- **Target:** ES2020
- **Module:** CommonJS
- **Output:** `dist/` directory
- **Strict Mode:** Enabled
- **Source Maps:** Yes

---

### ecosystem.config.js
PM2 configuration for production deployment.

**App Name:** `api`
**Script:** `src/index.ts`
**Interpreter:** node with ts-node/register
**Environment:** development

---

## Security & Operational Notes

### 🔴 Critical Vulnerabilities

1. **Hardcoded Credentials**
   - Telegram token in source
   - MongoDB connection string exposed
   - Discord webhook URL exposed
   - GoFile API token exposed
   
   **Mitigation:** Move to `.env` file, use environment variables

2. **No Input Validation**
   - Webhook URLs not validated
   - File names sanitized but paths not fully restricted
   - API key validation minimal (only checks existence)

3. **IP Blacklist Insufficient**
   - Only 9 hardcoded IPs
   - Easy to bypass with proxy/VPN

4. **Rate Limiting Weak**
   - 150 requests per ~24 days = ~0.1 req/min
   - Ineffective DoS protection

5. **No Encryption**
   - Passwords stored in plain text in metadata
   - Tokens logged in full
   - No TLS enforcement

### ⚠️ Operational Concerns

1. **Build System Dependency**
   - Requires `Stealer/` directory with `npm run package-electron`
   - Expects Electron builder setup
   - Long compile times block other commands

2. **File Storage**
   - Uploads stored locally with timestamps
   - No cleanup mechanism visible
   - Could fill disk over time

3. **Webhook Reliability**
   - Failed webhooks silently swallowed with try-catch
   - No retry logic
   - No notification if Discord is unreachable

4. **MongoDB Dependency**
   - No connection pooling configuration
   - No backup mechanism
   - Single point of failure

### ✅ Best Practices Followed

1. **Abstract Base Classes** - `Command` and `Event`
2. **Dynamic Loading** - Extensible command/event system
3. **Error Handling** - Try-catch blocks throughout
4. **Middleware Pattern** - Express middleware for auth/logging
5. **Data Models** - Mongoose schemas with interfaces

---

## File Structure Summary

```
bot/
├── src/
│   ├── api/
│   │   └── Server.ts          # Express API endpoints
│   ├── client/
│   │   └── BotClient.ts       # Telegraf wrapper & loader
│   ├── commands/
│   │   ├── BuildCommand.ts    # Build system
│   │   ├── ClaimCommand.ts    # Access claiming
│   │   ├── CheckKeyCommand.ts # Owner: key lookup
│   │   ├── CreateKeyCommand.ts # Owner: key generation
│   │   ├── DeleteKeyCommand.ts # Owner: revoke access
│   │   ├── ListKeysCommand.ts # Owner: list keys
│   │   ├── StartCommand.ts    # Help/info
│   │   └── WebhookCommand.ts  # Webhook management
│   ├── database/
│   │   └── mongo.ts           # MongoDB connection
│   ├── events/
│   │   └── MessageTextEvent.ts # Message logging
│   ├── models/
│   │   ├── ClaimKey.ts        # Key schema
│   │   ├── UploadRecord.ts    # Data log schema
│   │   └── UserAccess.ts      # User schema
│   ├── structures/
│   │   ├── Command.ts         # Command base class
│   │   └── Event.ts           # Event base class
│   ├── utils/
│   │   ├── getBadges.ts       # Discord badge mapping
│   │   ├── message.ts         # Text extraction
│   │   ├── notifyWebhook.ts   # Discord notifications
│   │   └── scheduleForward.ts # User webhook relay
│   ├── config.ts              # Constants & credentials
│   └── index.ts               # Entry point
├── package.json
├── ecosystem.config.js        # PM2 config
└── tsconfig.json
```

---

## Environment & Deployment

### Required Environment Variables (Currently Hardcoded)

Create a `.env` file:
```env
TELEGRAM_TOKEN=8586476563:AAEqHHBwjv73hgMhCsmZ7j1CdC1XtlKJAyk
MONGO_URI=mongodb+srv://user:pass@host/database
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
GOFILE_TOKEN=h3NzFkO1KiQyya50DmzTpRosCHjvzlmS
GOFILE_ID=87aeb7b8-8804-449e-98a5-b3ad59ccebd3
OWNER_ID=7986121972
API_PORT=3000
```

### Database Schema

**Collections:**
1. **claimkeys** - Access tokens
2. **useraccess** - User profiles and configurations
3. **uploadrecords** - Data collection audit log

**Indexes:**
- ClaimKey: `key` (unique)
- UserAccess: `userId` (unique)
- UploadRecord: `route`, `createdAt`

### Running the Bot

**Development:**
```bash
npm install
npm run dev
```

**Production:**
```bash
npm install
npm run build
npm start

# Or with PM2:
pm2 start ecosystem.config.js
```

---

## Data Flow Examples

### 1. User Claiming Access

```
User: /claim HADEST_Premium_abc123
   ↓
ClaimCommand.execute()
   ├─ Validate key not used
   ├─ Fetch ClaimKey document
   ├─ Create/update UserAccess
   ├─ Mark key as used
   └─ Reply with expiration
```

### 2. Malware Reporting Data

```
Malware → POST /discord
   ↓
API validates API_KEY header
   ↓
Parse userInfo, token, friends
   ↓
Save UploadRecord to MongoDB
   ↓
notifyWebhook():
   ├─ Fetch UserAccess by buildId
   ├─ Format rich embed
   ├─ Send to Discord webhook
   └─ scheduleForward() to user's webhook (after 10s delay)
```

### 3. Building Custom Malware

```
User: /build
   ↓
ShowMainMenu():
   ├─ Load build config from UserAccess
   └─ Display current settings
   ↓
User selects "Build Setup"
   ↓
For each config field:
   ├─ Prompt for input
   ├─ Update UserAccess.build
   └─ Show confirmation
   ↓
User selects "Start Building"
   ↓
runBuild():
   ├─ Validate access not expired
   ├─ Generate random API key
   ├─ Inject BUILD_ID, API_KEY, THEME into constants.ts
   ├─ Update package.json metadata
   ├─ Execute npm run package-electron
   ├─ Upload .exe to GoFile.io
   └─ Return download link
```

---

## Conclusion

This is a **sophisticated malware distribution and data aggregation system** with:
- **Command-driven Telegram interface** for user-friendly operations
- **RESTful API** for malware callback communications
- **MongoDB backend** for persistent records
- **Discord integration** for real-time notifications
- **Custom build system** allowing per-user malware variants
- **Webhook relay** for separating attacker identity from final notification destination

The architecture prioritizes **ease of use** for the operator and **flexibility in customization**, at the cost of significant security hardening.

---

**Last Updated:** Generated from source analysis
**Language:** TypeScript
**Deployment:** Node.js (PM2 recommended)
