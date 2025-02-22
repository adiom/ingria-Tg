require('dotenv').config();

const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

// Чтение переменных из .env
const bot = new Telegraf(process.env.BOT_TOKEN);
const ANALYZER_URL = process.env.ANALYZER_URL;

bot.on('voice', async (ctx) => {
  // Получаем голосовое сообщение
  const voiceFileId = ctx.message.voice.file_id;
  const file = await ctx.telegram.getFile(voiceFileId);

  const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

  // Отправляем файл на бэкенд для анализа
  const response = await fetch(ANALYZER_URL, {
    method: 'POST',
    body: JSON.stringify({ fileUrl }), // Передаем ссылку на голосовой файл
    headers: { 'Content-Type': 'application/json' },
  });

  // Получаем ответ от бэкенда
  const data = await response.json();

  // Отправляем ответ пользователю
  if (data && data.result) {
    ctx.reply(`Ответ от Ingria Media Analyzer: ${data.result}`);
  } else {
    ctx.reply('Не удалось обработать голосовое сообщение.');
  }
});

bot.launch();
