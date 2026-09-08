const token = '8766198014:AAH5XZcAfPo-YwmoA5Y-71Lia62Itq0YCPk';
const chatId = '@ercoppolacr';
const text = '👋 Ciao! Il bot di Clash War Tracker è connesso con successo al gruppo. Sono pronto per inviare i report delle guerre fluviali! ⚔️';

async function testBot() {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
    const data = await res.json();
    console.log("Telegram API Response:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

testBot();
