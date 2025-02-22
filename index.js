const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const ANALYZER_URL = "https://ingria-backend.vercel.app/analyze"; // Заменить на реальный URL

// Функция для загрузки голосового сообщения в бэкенд
async function analyzeVoice(filePath, ctx) {
  console.log("📤 Отправляем файл в бэкенд:", filePath);

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const response = await fetch(ANALYZER_URL, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const data = await response.json();
    console.log("📊 Ответ от бэкенда:", data);

    if (data.result) {
      ctx.reply(`Ответ от Ingria Media Analyzer: ${data.result}`);
    } else {
      ctx.reply('Не удалось обработать голосовое сообщение.');
    }
  } catch (error) {
    console.error("❌ Ошибка отправки в бэкенд:", error);
    ctx.reply('Ошибка при обработке голосового сообщения.');
  }
}

// Обработчик голосовых сообщений
bot.on('voice', async (ctx) => {
  const voiceFileId = ctx.message.voice.file_id;
  const file = await ctx.telegram.getFile(voiceFileId);
  const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
  
  console.log("🎤 Загружаем голосовое сообщение:", fileUrl);

  // Скачиваем файл во временную папку
  const tempFilePath = path.join(__dirname, 'temp.oga');
  const res = await fetch(fileUrl);
  const fileStream = fs.createWriteStream(tempFilePath);

  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });

  // Отправляем файл в бэкенд
  await analyzeVoice(tempFilePath, ctx);

  // Удаляем файл после обработки
  fs.unlinkSync(tempFilePath);
});

bot.launch().then(() => console.log("🚀 Бот успешно запущен и ждёт сообщений!"));
