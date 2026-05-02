# 🔨 Auction Bot for Telegram

A Telegram bot that automates knife auction management in Telegram channels. It monitors bids in comments, validates them by auction rules, reacts to valid bids, and announces the winner when the auction ends.

---

## How It Works

1. Owner posts an auction announcement in the channel
2. Bot detects the post and parses the rules (start price, min/max bid step, end time)
3. Users place bids in the linked discussion group comments
4. Bot validates each bid and reacts with ❤️ to valid ones
5. At the end time, bot announces the winner in comments and notifies the owner in DM

---

## Features

- Automatic auction detection from channel posts
- Bid validation:
  - Minimum bid step enforced
  - Maximum bid step enforced
  - Users cannot outbid themselves
  - Users who delete bids are blocked for the current auction
- Winner announcement in comments (reply to winning bid)
- Owner notification in DM with winner's username and amount
- Original auction post forwarded to owner on completion
- `/stop` command for owner to cancel an active auction

---

## Requirements

- Node.js v18+
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- A Telegram channel with a linked discussion group

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/auction-bot.git
cd auction-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```
BOT_TOKEN=your_telegram_bot_token
OWNER_TELEGRAM_ID=your_telegram_user_id
```

To get your Telegram ID, message [@userinfobot](https://t.me/userinfobot).

### 4. Run the bot

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

---

## Bot Setup in Telegram

### Disable Privacy Mode

1. Open [@BotFather](https://t.me/BotFather)
2. Send `/mybots` → select your bot
3. Go to **Bot Settings** → **Group Privacy** → **Turn off**

### Add Bot to Your Channel

1. Open your channel settings
2. Go to **Administrators** → **Add Administrator**
3. Search for your bot and add it
4. Grant permissions: **Post Messages**, **Edit Messages**

### Add Bot to the Discussion Group

1. Open your linked discussion group settings
2. Go to **Administrators** → **Add Administrator**
3. Search for your bot and add it
4. Grant permissions: **Send Messages**, **Delete Messages**

### Activate the Bot

Send `/start` to your bot in a private message — this registers you as the owner so the bot knows where to send winner notifications.

---

## Auction Post Format

The bot automatically detects auction posts containing the words **"аукціон"** and **"починаємо"**. Example:

```
🚨 Аукціон 🚨
Починаємо 500 грн
Мінімальний крок ставки 100 грн
‼️ Ставка НЕ повинна перевищувати 300 грн
Час закінчення 15:01
```

The bot parses:

| Field | Example | Pattern |
|---|---|---|
| Start price | `500 грн` | `Починаємо {number}` |
| Min step | `100 грн` | `Мінімальний крок ... {number}` |
| Max step | `300 грн` | `перевищувати {number}` |
| End time | `15:01` | `Час закінчення {HH:MM}` |

---

## Project Structure

```
auction-bot/
├── src/
│   ├── index.js       # Entry point, bot setup, event handlers
│   ├── parser.js      # Parses auction rules from post text
│   ├── validator.js   # Validates incoming bids
│   └── auction.js     # Auction state management and lifecycle
├── .env               # Environment variables (never commit this)
├── .gitignore
└── package.json
```

---

## Deployment

See [Railway deployment guide](https://docs.railway.app) for free hosting.

Set the following environment variables in Railway dashboard:
- `BOT_TOKEN`
- `OWNER_TELEGRAM_ID`

---

## .gitignore

Make sure your `.env` is never committed:

```
node_modules/
.env
```

---

## License

MIT