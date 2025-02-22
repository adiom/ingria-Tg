require('dotenv').config();
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ANALYZER_URL = process.env.ANALYZER_URL || "http://your-ingria-backend-url/analyze";

if (!BOT_TOKEN) {
    console.error("Ошибка: BOT_TOKEN не задан!");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

console.log("🚀 Бот запускается...");
bot.telegram.sendMessage(process.env.ADMIN_ID, "🤖 Бот запущен и готов к работе!").catch(console.error);

bot.start((ctx) => {
    ctx.reply("Привет! Отправь мне голосовое сообщение, и я отправлю его на анализ.");
});

// Логирование сообщений
bot.on('message', async (ctx) => {
    console.log("📩 Новое сообщение от", ctx.message.from.username || ctx.message.from.id);
});

// Обработка голосовых сообщений
bot.on('voice', async (ctx) => {
    try {
        console.log("🎤 Получено голосовое сообщение");

        const voiceFileId = ctx.message.voice.file_id;
        const file = await ctx.telegram.getFile(voiceFileId);
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;

        console.log("📤 Отправляем файл на анализ:", fileUrl);

        const response = await fetch(ANALYZER_URL, {
            method: 'POST',
            body: JSON.stringify({ fileUrl }),
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error(`Ошибка запроса: ${response.statusText}`);

        const data = await response.json();
        console.log("📥 Ответ от бэкенда:", data);

        if (data && data.result) {
            ctx.reply(`🔍 Результат анализа: ${data.result}`);
        } else {
            ctx.reply('⚠️ Не удалось обработать голосовое сообщение.');
        }
    } catch (err) {
        console.error("❌ Ошибка при обработке голосового сообщения:", err);
        ctx.reply("Произошла ошибка при анализе. Попробуй позже.");
    }
});

// Глобальная обработка ошибок
bot.catch((err, ctx) => {
    console.error(`❌ Ошибка обработки апдейта (${ctx.updateType}):`, err);
});

bot.launch().then(() => console.log("✅ Бот успешно запущен!"));
