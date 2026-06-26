import nodemailer from 'nodemailer'
import User from '../models/User.js'

function mask(v){ if(!v) return '(empty)'; if(v.length>6) return v.slice(0,2)+'...'+v.slice(-2); return '***' }

function readConfig(){
  const cfg = {
    SMTP_HOST: process.env.SMTP_HOST ? String(process.env.SMTP_HOST).trim() : undefined,
    SMTP_PORT: process.env.SMTP_PORT ? Number(String(process.env.SMTP_PORT).trim()) : undefined,
    SMTP_USER: process.env.SMTP_USER ? String(process.env.SMTP_USER).trim() : undefined,
    SMTP_PASS: process.env.SMTP_PASS ? String(process.env.SMTP_PASS).trim() : undefined,
    FROM_EMAIL: process.env.FROM_EMAIL ? String(process.env.FROM_EMAIL).trim() : undefined,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS
  }
  if(!cfg.FROM_EMAIL) cfg.FROM_EMAIL = cfg.SMTP_USER || 'no-reply@example.com'
  return cfg
}

let transporter
export function getTransporter(){
  if(transporter) return transporter
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = readConfig()
  if(!SMTP_HOST || !SMTP_USER || !SMTP_PASS){
    console.warn('Mailer: missing SMTP config (SMTP_HOST/SMTP_USER/SMTP_PASS). Emails will not be sent.')
    console.warn('Mailer debug:', { SMTP_HOST: mask(SMTP_HOST), SMTP_USER: mask(SMTP_USER), SMTP_PASS: SMTP_PASS ? '(set)' : '(empty)', SMTP_PORT })
    return null
  }
  transporter = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT || 587, secure: SMTP_PORT==465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
  return transporter
}

export async function getAdminEmails(){
  const { ADMIN_EMAILS } = readConfig()
  if(ADMIN_EMAILS){
    return ADMIN_EMAILS.split(',').map(s=> s.trim()).filter(Boolean)
  }
  try{
    const users = await User.find({ role: 'ADMIN' }).lean()
    return users.map(u=> u.email).filter(Boolean)
  } catch(e){ return [] }
}

export async function sendMail({ to, subject, text, html }){
  const cfg = readConfig()
  const t = getTransporter()
  if(!t){ console.warn('sendMail skipped; transporter not configured'); return false }
  const info = await t.sendMail({ from: cfg.FROM_EMAIL, to, subject, text, html })
  return info
}

export async function notifyAdmins(subject, htmlBody, textBody){
  const emails = await getAdminEmails()
  if(!emails || emails.length === 0){ console.warn('notifyAdmins: no admin emails found'); return }
  try{
    await sendMail({ to: emails.join(','), subject, html: htmlBody, text: textBody })
  } catch(e){ console.error('notifyAdmins error', e) }
}

export default { getAdminEmails, sendMail, notifyAdmins, getTransporter }
