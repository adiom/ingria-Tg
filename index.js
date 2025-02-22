require('dotenv').config();
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ANALYZER_URL = "http://your-ingria-backend-url/analyze"; // Замени на реальный URL

// Логируем запуск бота
console.log("🚀 Бот запускается...");

// Обрабатываем любые сообщения
bot.on('message', async (ctx) => {
  console.log("📩 Получено сообщение:", ctx.message);

  if (ctx.message.voice) {
    const voiceFileId = ctx.message.voice.file_id;
    const file = await ctx.telegram.getFile(voiceFileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

    console.log("🎤 Отправляем голосовое сообщение на анализ:", fileUrl);

    try {
      const response = await fetch(ANALYZER_URL, {
        method: 'POST',
        body: JSON.stringify({ fileUrl }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      console.log("📊 Ответ от бэкенда:", data);

      ctx.reply(data.result ? `📢 Ответ от Ingria: ${data.result}` : "⚠️ Не удалось обработать голос.");
    } catch (error) {
      console.error("❌ Ошибка при отправке на анализ:", error);
      ctx.reply("🚨 Произошла ошибка при обработке голосового сообщения.");
    }
  } else {
    ctx.reply("Привет! Отправь мне голосовое сообщение.");
  }
});

// Убираем возможный Webhook, чтобы избежать конфликта
bot.telegram.deleteWebhook();

// Запускаем бота
bot.launch().then(() => console.log("✅ Бот успешно запущен и ждёт сообщений!"));
