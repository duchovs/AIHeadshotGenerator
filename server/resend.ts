import { Resend } from 'resend';
import { env } from './env';
import { Email } from '../client/src/components/ReactEmail';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendModelCompletionEmail(userEmail: string, modelId: number) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Headshot AI <no-reply@aismartsolution.ai>',
      to: [userEmail],
      subject: 'Your AI Model Training is Complete! 🎉',
      react: Email({ url: `https://headshot.aismartsolution.ai/generate/${modelId}` }), // Use the Email component properly
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}