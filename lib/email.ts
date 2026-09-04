import { Resend } from 'resend';
import { getJson, setJson } from './db';
const OTP_TTL_SECONDS = 600; // 10 minutes

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(email: string): Promise<boolean> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const otp = generateOTP();
  const expiry = Date.now() + OTP_TTL_SECONDS * 1000;

  // Save OTP in Redis with expiry
  await setJson(`cwt:otp:${email}`, { otp, expiry });

  try {
    await resend.emails.send({
      from: 'Clan War Tracker <onboarding@resend.dev>',
      to: [email],
      subject: '⚔️ Il tuo codice di accesso — Clan War Tracker',
      html: `
        <div style="background:#080815;padding:40px;font-family:sans-serif;max-width:400px;margin:0 auto;border-radius:12px;border:1px solid rgba(240,192,48,0.3)">
          <div style="text-align:center;margin-bottom:24px">
            <div style="font-size:40px">⚔️</div>
            <h2 style="color:#f0c030;font-size:22px;margin:8px 0">Clan War Tracker</h2>
          </div>
          <p style="color:#aaaacc;font-size:14px;margin-bottom:16px">Il tuo codice di accesso è:</p>
          <div style="background:#0c0c1c;border:1px solid rgba(240,192,48,0.4);border-radius:8px;padding:20px;text-align:center;margin-bottom:20px">
            <span style="font-size:36px;font-weight:bold;color:#f0c030;letter-spacing:8px">${otp}</span>
          </div>
          <p style="color:#888888;font-size:12px;text-align:center">Valido per 10 minuti. Non condividere questo codice.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Resend error:', err);
    return false;
  }
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  const stored = await getJson(`cwt:otp:${email}`);
  if (!stored) return false;
  if (Date.now() > stored.expiry) return false;
  if (stored.otp !== code) return false;
  // Invalidate OTP after use
  await setJson(`cwt:otp:${email}`, null);
  return true;
}
