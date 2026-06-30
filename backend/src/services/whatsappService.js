import axios from 'axios';

const WA_BASE = 'https://graph.facebook.com/v19.0';

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  };
}

export async function getPhoneNumberInfo() {
  try {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const response = await axios.get(
      `${WA_BASE}/${phoneId}`,
      {
        headers: getHeaders(),
        params: {
          fields: 'display_phone_number,verified_name'
        }
      }
    );
    return response.data;
  } catch (err) {
    console.error('[WhatsApp] getPhoneNumberInfo error:', err.response?.data || err.message);
    return null;
  }
}

export async function getMessageAnalytics(start, end) {
  try {
    const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    if (!wabaId) return null;

    const response = await axios.get(
      `${WA_BASE}/${wabaId}`,
      {
        headers: getHeaders(),
        params: {
          fields: `analytics.start(${start}).end(${end}).granularity(DAY)`
        }
      }
    );
    return response.data;
  } catch (err) {
    console.error('[WhatsApp] getMessageAnalytics error:', err.response?.data || err.message);
    return null;
  }
}
