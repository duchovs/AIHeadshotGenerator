import React from 'react';

export default function Email({ url }: { url: string }) {
  return (
    <div style={{ backgroundColor: '#f6f9fc', fontFamily: 'Segoe UI, Arial, sans-serif', padding: 0, margin: 0 }}>
      <div style={{ margin: '40px auto', background: '#fff', borderRadius: 8, maxWidth: 480, padding: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <img
          src="https://headshot.aismartsolution.ai/logo.png"
          width="128"
          height="124"
          alt="Headshot AI"
          style={{ display: 'block' }}
        />
        <span style={{
      ...logoText,
      marginLeft: 24,
      display: 'flex',
      alignItems: 'center',
      height: '124px',
      verticalAlign: 'middle',
    }}>
          Headshot <span style={{ color: '#007bff', fontWeight: 700 }}>AI</span>
        </span>
      </div>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Your AI Model is Ready! 🎉</h1>
        <p style={{ fontSize: 16, marginBottom: 16 }}>
          Great news! Your AI model has finished training and is now ready to generate amazing headshots.
        </p>
        <p style={{ fontSize: 16, marginBottom: 16 }}>
          Click the button below to start creating your professional headshots:
        </p>
        <a
          href={url}
          style={{
            display: 'inline-block',
            background: '#0070f3',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 'bold',
            marginBottom: 24,
          }}
        >
          Generate Headshots
        </a>
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '24px 0' }} />
        <div style={{ fontSize: 12, color: '#888', marginTop: 24 }}>
          Thank you for choosing Headshot AI. If you have any questions, please don't hesitate to reach out to our support team.
        </div>
      </div>
    </div>
  );
}

const logoText = {
  fontFamily: 'Segoe UI, Arial, sans-serif',
  fontWeight: 600,
  fontSize: '2rem',
  color: '#222',
  letterSpacing: '0.02em',
  lineHeight: 1.1,
  display: 'inline-block',
  verticalAlign: 'middle',
};

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
