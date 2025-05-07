import * as React from 'react';
import {
  Html,
  Button,
  Container,
  Head,
  Hr,
  Img,
  Preview,
  Section,
  Text,
  Body,
} from '@react-email/components';

interface EmailProps {
  url: string;
}

export function Email({ url }: EmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your AI Headshots are ready! 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logo}>
            <Img
              src="https://headshot.aismartsolution.ai/logo.png"
              width="128"
              height="124"
              alt="Headshot AI"
            />
          </Section>
          <Section style={content}>
            <Text style={heading}>Your AI Model is Ready! 🎉</Text>
            <Text style={paragraph}>
              Great news! Your AI model has finished training and is now ready to generate amazing headshots.
            </Text>
            <Text style={paragraph}>
              Click the button below to start creating your professional headshots:
            </Text>
            <Button style={button} href={url}>
              Generate Headshots
            </Button>
            <Hr style={hr} />
            <Text style={footer}>
              Thank you for choosing Headshot AI. If you have any questions, please don't hesitate to reach out to our support team.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '"-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '5px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const logo = {
  padding: '20px 30px',
  borderBottom: '1px solid #e6ebf1',
};

const content = {
  padding: '0 30px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
};

const paragraph = {
  margin: '0 0 15px',
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#3c4149',
};

const button = {
  backgroundColor: '#5850ec',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};

export default Email;