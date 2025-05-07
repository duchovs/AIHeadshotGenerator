import React from 'react';
import { Resend } from 'resend';
import Email from './emails/training-completion-email';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendModelCompletionEmail(userEmail: string, modelId: number) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Headshot AI <no-reply@aismartsolution.ai>',
      to: [userEmail],
      subject: 'Your AI Model Training is Complete! 🎉',
      react: <Email url={`https://headshot.aismartsolution.ai/generate/${modelId}`}/>,
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