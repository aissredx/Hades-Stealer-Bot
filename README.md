# 🤖 Hadestealer Bot

Hadestealer Bot, Telegram üzerinden çalışan ve bir C2 (Command & Control) sunucusuna bağlı, anahtar tabanlı erişim sistemi içeren bir yönetim botudur. Kullanıcılar anahtar talep ederek sisteme erişim sağlar, Discord webhook'larını yapılandırır ve özel yapılandırılmış `stealer` dosyaları oluşturabilir. Gelen veriler MongoDB'de saklanır ve Express.js tabanlı bir REST API aracılığıyla alınır.

---

## 📁 Proje Yapısı

```
bot/
├── ecosystem.config.js        # PM2 süreç yöneticisi yapılandırması
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts               # Uygulama giriş noktası
    ├── config.ts              # Yapılandırma sabitleri
    ├── api/
    │   └── Server.ts          # Express REST API sunucusu
    ├── client/
    │   └── BotClient.ts       # Telegram bot istemcisi
    ├── commands/              # Bot komutları
    │   ├── BuildCommand.ts
    │   ├── CheckKeyCommand.ts
    │   ├── ClaimCommand.ts
    │   ├── CreateKeyCommand.ts
    │   ├── DeleteKeyCommand.ts
    │   ├── ListKeysCommand.ts
    │   ├── StartCommand.ts
    │   └── WebhookCommand.ts
    ├── database/
    │   └── mongo.ts           # MongoDB bağlantısı
    ├── events/
    │   └── MessageTextEvent.ts # Telegram mesaj olayı işleyicisi
    ├── models/                # Mongoose şema modelleri
    │   ├── ClaimKey.ts
    │   ├── UploadRecord.ts
    │   └── UserAccess.ts
    ├── structures/
    │   ├── Command.ts         # Temel komut sınıfı
    │   └── Event.ts           # Temel olay sınıfı
    └── utils/
        ├── getBadges.ts       # Discord rozet yardımcısı
        ├── message.ts         # Mesaj metin çıkarma
        ├── notifyWebhook.ts   # Webhook bildirim formatlayıcı
        └── scheduleForward.ts # Gecikmeli webhook yönlendirme
```

---

## ⚙️ Yapılandırma

`src/config.ts` dosyasında aşağıdaki sabitler tanımlanmıştır:

| Sabit | Açıklama |
|---|---|
| `OWNER_ID` | Bot sahibinin Telegram kullanıcı ID'si |
| `BOT_TOKEN` | Telegram Bot API token'ı |
| `MONGO_URI` | MongoDB bağlantı URI'si |
| `API_KEY` | REST API kimlik doğrulama anahtarı |
| `PORT` | Express sunucusunun çalışacağı port |
| `emojis` | Discord rozet türleri için emoji eşleştirme haritası |

---

## 🗄️ Veritabanı Modelleri

### `UserAccess`
Sisteme erişim sağlamış kullanıcıları temsil eder.

| Alan | Tür | Açıklama |
|---|---|---|
| `userId` | String | Telegram kullanıcı ID'si |
| `username` | String | Telegram kullanıcı adı |
| `webhook` | String | Kullanıcının Discord webhook URL'i |
| `expiresAt` | Date | Erişim bitiş tarihi |
| `buildConfig` | Object | Özel build yapılandırması |
| `apiKey` | String | Kullanıcıya özel API anahtarı |

### `ClaimKey`
Erişim için kullanılan tek kullanımlık anahtarları temsil eder.

| Alan | Tür | Açıklama |
|---|---|---|
| `key` | String | Benzersiz anahtar değeri |
| `duration` | Number | Erişim süresi (gün) |
| `used` | Boolean | Kullanılıp kullanılmadığı |
| `usedBy` | String | Anahtarı kullanan kullanıcı ID'si |
| `usedAt` | Date | Kullanım tarihi |
| `createdAt` | Date | Oluşturulma tarihi |

### `UploadRecord`
Stealer istemcilerinden gelen tüm yüklemelerin kayıtlarını tutar.

| Alan | Tür | Açıklama |
|---|---|---|
| `userId` | String | İlgili kullanıcı ID'si |
| `type` | String | Veri türü (browser, discord, wallet, vb.) |
| `data` | Mixed | Yüklenen veri |
| `timestamp` | Date | Yükleme zamanı |

---

## 💬 Bot Komutları

### Kullanıcı Komutları

| Komut | Açıklama |
|---|---|
| `/start` | Botu başlatır, hoş geldin mesajı gösterir |
| `/claim <anahtar>` | Erişim anahtarı kullanarak sisteme dahil olur |
| `/webhook <url>` | Discord webhook URL'ini kaydeder veya günceller |
| `/build` | Kişiselleştirilmiş stealer yapılandırma dosyasını oluşturur ve gönderir |

### Sahip Komutları (Yalnızca `OWNER_ID`)

| Komut | Açıklama |
|---|---|
| `/createkey <gün>` | Belirtilen süre için yeni bir erişim anahtarı oluşturur |
| `/listkeys` | Tüm anahtarları (kullanılmış/kullanılmamış) listeler |
| `/checkkey <anahtar>` | Belirli bir anahtarın durumunu sorgular |
| `/deletekey <anahtar>` | Bir anahtarı siler |

---

## 🌐 REST API Uç Noktaları

Tüm istekler `X-API-KEY` başlığı ile kimlik doğrulama gerektirir.

**Base URL:** `http://localhost:<PORT>`

| Yöntem | Uç Nokta | Açıklama |
|---|---|---|
| `GET` | `/health` | Sunucu sağlık kontrolü |
| `POST` | `/discord` | Discord hesap bilgilerini alır |
| `POST` | `/browser` | Tarayıcı verisi (şifreler, çerezler vb.) yükler |
| `POST` | `/wallet` | Kripto cüzdanı verisi yükler |
| `POST` | `/screenshot` | Ekran görüntüsü yükler |
| `POST` | `/sysinfo` | Sistem bilgisi yükler |
| `POST` | `/inject` | Discord enjeksiyon verisi alır |
| `POST` | `/log` | Genel log mesajı alır |
| `POST` | `/error` | Hata raporu alır |
| `POST` | `/files` | Dosya yüklemesi alır |

---

## 🛠️ Yardımcı Fonksiyonlar

### `getBadges(flags: number): string`
Discord kullanıcı bayrak bitmasklarını emoji rozetlerine dönüştürür.  
Örnek: `HypeSquad`, `Early Supporter`, `Bug Hunter` vb.

### `message(ctx): string`
Telegram bağlamından mesaj metnini güvenli biçimde çıkarır.

### `notifyWebhook(data, webhookUrl)`
Stealer'dan gelen veriyi Discord embed formatına dönüştürür ve webhook URL'ine gönderir.

### `scheduleForward(data, webhookUrl, delayMs)`
Webhook bildirimini belirtilen gecikme süresi sonra iletir.

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler

- Node.js 18+
- MongoDB
- PM2 (opsiyonel, production için)

### Adımlar

```bash
# Bağımlılıkları yükle
cd bot
npm install

# TypeScript'i derle
npm run build

# Geliştirme modunda çalıştır
npm run dev

# PM2 ile production modunda çalıştır
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

## 📦 Bağımlılıklar

| Paket | Açıklama |
|---|---|
| `telegraf` | Telegram Bot API framework'ü |
| `mongoose` | MongoDB ODM |
| `express` | REST API sunucusu |
| `axios` | HTTP istemcisi |
| `multer` | Çoklu parçalı dosya yükleme |
| `typescript` | Tür güvenli geliştirme |
| `ts-node` | TypeScript çalıştırma ortamı |

---

## 📋 Geliştirme Notları

- Tüm komutlar `src/structures/Command.ts` temel sınıfını miras alır.
- Tüm olaylar `src/structures/Event.ts` temel sınıfını miras alır.
- `BotClient` başlangıçta komutları ve olayları otomatik olarak yükler.
- API sunucusu ve Telegram botu eş zamanlı olarak çalışır.
- Sahip komutları `userId === OWNER_ID` kontrolüyle korunur.
