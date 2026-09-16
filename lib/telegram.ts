export async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_TEACHER_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram не настроен: проверь TELEGRAM_BOT_TOKEN и TELEGRAM_TEACHER_CHAT_ID в .env.local');
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Telegram API error:', err);
    }
  } catch (error) {
    console.error('Telegram error:', error);
  }
}