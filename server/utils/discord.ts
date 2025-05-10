import axios from 'axios';
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1365770487317139607/a-n1RX98BKDUeyDiRwU1f0gS5bH_-bvfA_b1ycKiA-FRQTwuQCUm9P3aMHRIji0z-8V-';

export const sendDiscordNotification = async (message: string) => {
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send Discord notification: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }
};

// Axios version
export const sendDiscordNotificationAxios = async (message: string) => {
  try {
    const response = await axios.post(DISCORD_WEBHOOK_URL, {
      content: message,
    });

    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`Failed to send Discord notification: ${response.statusText}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Failed to send Discord notification:', error.message);
    } else {
      console.error('Failed to send Discord notification:', error);
    }
  }
};

