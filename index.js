// INGRIA TELEGRAM NODEJS + ЛОГИ НА ПОРТУ 3000
require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const FormData = require('form-data');
const app = express();
const PORT = 3000;
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://ingria-backend.vercel.app/analyze';

if (!TELEGRAM_BOT_TOKEN) {
    console.error('Ошибка: Не найден токен Telegram бота.');
    process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

let logs = [];

function logMessage(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    logs.push(logEntry);
    console.log(logEntry);
    if (logs.length > 100) logs.shift();
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Привет! Отправь мне фото или голосовое.');
});

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Отправь фото или голосовое – я обработаю!');
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    logMessage(`Сообщение от @${msg.from.username || msg.from.first_name}: ${msg.text || '[Файл]'} `);

    if (msg.photo) {
        try {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            const fileInfo = await bot.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;

            const imageResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            const formData = new FormData();
            formData.append('file', Buffer.from(imageResponse.data), { filename: 'image.jpg', contentType: 'image/jpeg' });

            const backendResponse = await axios.post(BACKEND_API_URL, formData, { headers: formData.getHeaders() });

            // Отправляем фото обратно с текстом анализа
            bot.sendPhoto(chatId, fileId, { caption: `📷 Анализ изображения: ${backendResponse.data.description}` });
        } catch (error) {
            logMessage(`Ошибка обработки фото: ${error.message}`);
            bot.sendMessage(chatId, 'Ошибка обработки фото.');
        }
    } else if (msg.voice) {
        try {
            const fileId = msg.voice.file_id;
            const fileInfo = await bot.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;

            const audioResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            const formData = new FormData();
            formData.append('file', Buffer.from(audioResponse.data), { filename: 'audio.ogg', contentType: 'audio/ogg' });

            const backendResponse = await axios.post(BACKEND_API_URL, formData, { headers: formData.getHeaders() });

            // Отправляем голосовое сообщение обратно с текстом анализа
            bot.sendVoice(chatId, fileId, { caption: `🎙️ Анализ аудио: ${backendResponse.data.description}` });
        } catch (error) {
            logMessage(`Ошибка обработки аудио: ${error.message}`);
            bot.sendMessage(chatId, 'Ошибка обработки аудио.');
        }
    }
});

app.get('/', (req, res) => {
    res.send('<h1>Лог работы бота</h1><pre>' + logs.join('\n') + '</pre>');
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});s