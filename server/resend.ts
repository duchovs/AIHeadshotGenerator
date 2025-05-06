import { Resend } from 'resend';
import { env } from './env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendModelCompletionEmail(userEmail: string, modelId: number) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Headshot AI <no-reply@aismartsolution.ai>',
      to: [userEmail],
      subject: 'Your AI Model Training is Complete! 🎉',
      html: `
        <h1>Your AI Model is Ready!</h1>
        <p>Great news! Your AI model has finished training and is now ready to generate amazing headshots.</p>
        <p>You can start generating headshots right away by visiting:</p>
        <p><a href="https://headshot.aismartsolution.ai/generate/${modelId}">Click here to start generating headshots</a></p>
        <p>Thank you for using Headshot AI!</p>
      `,
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