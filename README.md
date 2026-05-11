# Auction Bot

A Telegram bot for automating knife auctions in channels. Monitors bids in comments, validates them against auction rules, reacts to valid bids with ❤️, and announces the winner when the auction ends.

---

## How It Works

1. Owner posts an auction announcement in the channel
2. Bot detects the post and parses the rules (start price, min/max bid step, end time)
3. Users place bids in the linked discussion group comments
4. Bot validates each bid and reacts with ❤️ to valid ones
5. At the end time - announces the winner in comments and notifies the owner in DM
6. Owner can cancel an active auction early with `/stop`

---

## Stack

- Node.js v18+
- [grammY](https://grammy.dev) - Telegram Bot framework
- [node-cron](https://github.com/node-cron/node-cron) - auction end time scheduler

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env` in the project root

```
BOT_TOKEN=your_telegram_bot_token
OWNER_TELEGRAM_ID=your_telegram_user_id
TZ=your time zone
```

You can get your Telegram ID from [@userinfobot](https://t.me/userinfobot).

### 3. Run

```bash
npm run dev    # development (auto-restart)
npm start      # production
```

---

## Auction Post Format

The bot detects posts containing the words **"аукціон"** and **"починаємо"**:

```
🚨 Аукціон 🚨
Починаємо 500 грн
Мінімальний крок ставки 100 грн
‼️ Ставка НЕ повинна перевищувати 300 грн
Час закінчення 15:01
```

| Field | Pattern |
|---|---|
| Start price | `Починаємо {number}` |
| Min step | `Мінімальний крок ... {number}` |
| Max step | `перевищувати {number}` |
| End time | `Час закінчення {HH:MM}` |

---

## Project Structure

```
auction-bot/
├── src/
│   ├── index.js       # Entry point, bot initialization
│   ├── auction.js     # Auction state, lifecycle, cancellation
│   ├── parser.js      # Parses auction rules from post text
│   ├── validator.js   # Bid validation logic
│   ├── logger.js      # Event logging
│   └── handlers/
│       ├── channelPost.js   # Channel post handler
│       ├── message.js       # Bid handler in group comments
│       ├── editedMessage.js # Edited message handler
│       └── commands.js      # Commands (/start, /stop)
├── .env
├── .gitignore
└── package.json
```

---

## Deployment on Railway

1. Push the repository to GitHub
2. Create a new project on [railway.app](https://railway.app)
3. Add environment variables: `BOT_TOKEN`, `OWNER_TELEGRAM_ID`, `TZ`
4. Railway will run `npm start` automatically

---

## .gitignore

node_modules/
.env
unit-tests.js
logs/