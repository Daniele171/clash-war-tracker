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
      html: `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background-color:#080815;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f0f0ff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#080815;padding:40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" max-width="500" border="0" cellspacing="0" cellpadding="0" style="max-width:500px;background:#0c0c1c;border-radius:24px;overflow:hidden;border:1px solid #c79a3c;box-shadow:0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(199,154,60,0.15);">
          
          <!-- Banner Image / Header -->
          <tr>
            <td align="center" style="background:linear-gradient(180deg, #1f1f3a 0%, #0c0c1c 100%);padding:48px 30px 30px;border-bottom:1px solid rgba(199,154,60,0.2);">
              <div style="font-size:64px;line-height:1;margin-bottom:16px;text-shadow:0 0 30px rgba(199,154,60,0.8);">⚔️</div>
              <h1 style="margin:0;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:32px;color:#facc15;letter-spacing:2px;text-transform:uppercase;text-shadow:0 2px 10px rgba(250,204,21,0.3);">
                Clan War Tracker
              </h1>
              <p style="margin:12px 0 0;font-size:15px;color:#a5b4fc;letter-spacing:1px;text-transform:uppercase;font-weight:500;">
                Accesso di Sicurezza
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;">
              <p style="margin:0 0 24px;font-size:16px;color:#e2e8f0;line-height:1.6;text-align:center;">
                Bentornato nel clan! Ti è stato richiesto un codice di accesso temporaneo per entrare nella tua dashboard.
              </p>

              <!-- OTP Container -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="background:linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(250,204,21,0.03) 100%);border:2px solid #eab308;border-radius:16px;padding:32px;margin:16px 0 32px;box-shadow:inset 0 0 20px rgba(250,204,21,0.05), 0 0 30px rgba(250,204,21,0.1);">
                      <p style="margin:0 0 12px;font-size:12px;color:#fbbf24;text-transform:uppercase;letter-spacing:4px;font-weight:700;font-family:'Rajdhani',sans-serif;">
                        Il tuo codice OTP
                      </p>
                      <div style="font-size:52px;font-weight:800;color:#fef08a;letter-spacing:12px;line-height:1;font-family:monospace;text-shadow:0 0 20px rgba(250,204,21,0.6);">
                        ${otp}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiry warning -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
                <tr>
                  <td align="center" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:12px;">
                    <p style="margin:0;font-size:13px;color:#fca5a5;font-weight:500;">
                      ⏱️ Il codice scadrà tra <strong style="color:#f87171;">10 minuti</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6;text-align:center;">
                Non hai richiesto questo codice? Ignora questa email e nessuno potrà accedere al tuo account.
              </p>
            </td>
          </tr>
          
        </table>

        <!-- Footer -->
        <table width="100%" max-width="500" border="0" cellspacing="0" cellpadding="0" style="max-width:500px;margin-top:24px;">
          <tr>
            <td align="center">
              <p style="margin:0;font-size:12px;color:#475569;font-family:'Rajdhani',sans-serif;letter-spacing:1px;">
                © 2026 CLAN WAR TRACKER
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#334155;">
                Generato automaticamente dal sistema
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`,
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
