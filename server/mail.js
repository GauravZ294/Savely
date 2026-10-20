import nodemailer from 'nodemailer';

const TO = process.env.CONTACT_TO || 'allinoneapps12@gmail.com';

function transport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: Number(SMTP_PORT || 465),
    secure: Number(SMTP_PORT || 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/** Sends a contact-form message to CONTACT_TO. Returns true if an email went out, false if SMTP isn't configured. */
export async function sendContact({ name, email, message }) {
  const t = transport();
  if (!t) { console.warn('[mail] SMTP not configured – message saved to the database only'); return false; }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  await t.sendMail({
    from: `"Savely website" <${process.env.SMTP_USER}>`,
    to: TO,
    replyTo: email,
    subject: `Savely contact form: ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `<p><b>Name:</b> ${esc(name)}<br><b>Email:</b> ${esc(email)}</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
  });
  return true;
}
