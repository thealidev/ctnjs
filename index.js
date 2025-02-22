const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const DEXSCREENER_API_URL = "https://api.dexscreener.com/latest/dex/tokens/solana";
const MIN_LIQUIDITY = 1000000;
const DEX_ID = "meteora";

let bot;

async function sendTelegramMessage(message) {
    if (!bot) {
        bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
    }
    try {
        await bot.sendMessage(TELEGRAM_CHAT_ID, message);
    } catch (error) {
        console.error(`Error sending Telegram message: ${error}`);
    }
}

async function checkNewCoins() {
    try {
        const response = await axios.get(DEXSCREENER_API_URL);
        const pairs = response.data.pairs;

        for (const pair of pairs) {
            if (pair.dexId === DEX_ID && pair.liquidity && pair.liquidity.usd >= MIN_LIQUIDITY) {

                const message = `New coin launched on Meteora:\n` +
                    `Pair: ${pair.baseToken?.name || 'Unknown'} / ${pair.quoteToken?.name || 'Unknown'}\n` +
                    `Address: ${pair.pairAddress}\n` +
                    `Liquidity: $${pair.liquidity.usd.toLocaleString()}\n` +
                    `Dexscreener: ${pair.url}`;

                await sendTelegramMessage(message);

            }
        }
    } catch (error) {
        console.error(`Error fetching data from Dexscreener: ${error}`);
    }
}

module.exports = async (req, res) => {
    try {
        await checkNewCoins();
        res.status(200).send("Bot checked for new coins.");
    } catch (error) {
        console.error("General Error", error);
        res.status(500).send("An error occurred.");
    }
};
