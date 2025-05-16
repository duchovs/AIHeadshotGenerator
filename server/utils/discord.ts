import axios from 'axios';
import { env } from '../env';

const DISCORD_WEBHOOK_URL = env.DISCORD_WEBHOOK_URL;

if (!DISCORD_WEBHOOK_URL) {
  throw new Error('DISCORD_WEBHOOK_URL environment variable is not set');
}

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

