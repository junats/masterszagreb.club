

async function setWebhook() {
  const token = '8726594753:AAFm31Jz1pEhrIkEgNekm5_3QKo8pxuRdug'; 
  const webhookUrl = 'https://script.google.com/macros/s/AKfycbyPL0F6j4bEUV8EKEbxY6iIOX3AiepX9VjrwxNmKPykm1iOsq3eENVu9uaS58oeK84/exec';
  
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`);
    const data = await res.json();
    console.log("Response:", data);
    if(data.ok) {
        console.log("✅ Webhook successfully connected to Google Apps Script!");
    } else {
        console.log("❌ Failed:", data.description);
    }
  } catch(e) {
    console.error("Error connecting to Telegram:", e);
  }
}

setWebhook();
