import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

interface Contact {
  vorname: string
  nachname: string
  email: string
  firma: string
}

interface SmtpConfig {
  host: string
  port: string
  username: string
  password: string
  fromEmail: string
  fromName: string
}

interface SendResult {
  email: string
  success: boolean
  error?: string
}

function replacePlaceholders(text: string, contact: Contact): string {
  return text
    .replace(/\[vorname\]/gi, contact.vorname)
    .replace(/\[nachname\]/gi, contact.nachname)
    .replace(/\[email\]/gi, contact.email)
    .replace(/\[firma\]/gi, contact.firma)
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contacts, template, subject, smtpConfig } = body as {
      contacts: Contact[]
      template: string
      subject: string
      smtpConfig: SmtpConfig
    }

    // Validate input
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'Keine Kontakte zum Versenden vorhanden.' },
        { status: 400 }
      )
    }

    if (!template || template.trim().length === 0) {
      return NextResponse.json(
        { error: 'Kein E-Mail-Template vorhanden.' },
        { status: 400 }
      )
    }

    if (!subject || subject.trim().length === 0) {
      return NextResponse.json(
        { error: 'Kein E-Mail-Betreff vorhanden.' },
        { status: 400 }
      )
    }

    if (!smtpConfig || !smtpConfig.host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password || !smtpConfig.fromEmail) {
      return NextResponse.json(
        { error: 'Unvollständige SMTP-Konfiguration.' },
        { status: 400 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port, 10),
      secure: parseInt(smtpConfig.port, 10) === 465,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Verify connection
    try {
      await transporter.verify()
    } catch (verifyError: any) {
      return NextResponse.json(
        { error: `SMTP-Verbindung fehlgeschlagen: ${verifyError.message}` },
        { status: 400 }
      )
    }

    // Send emails
    const results: SendResult[] = []
    const fromAddress = smtpConfig.fromName
      ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
      : smtpConfig.fromEmail

    for (const contact of contacts) {
      // Validate email
      if (!validateEmail(contact.email)) {
        results.push({
          email: contact.email,
          success: false,
          error: 'Ungültige E-Mail-Adresse',
        })
        continue
      }

      const personalizedSubject = replacePlaceholders(subject, contact)
      const personalizedHtml = replacePlaceholders(template, contact)

      try {
        await transporter.sendMail({
          from: fromAddress,
          to: contact.email,
          subject: personalizedSubject,
          html: personalizedHtml,
        })

        results.push({
          email: contact.email,
          success: true,
        })
      } catch (sendError: any) {
        results.push({
          email: contact.email,
          success: false,
          error: sendError.message,
        })
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Close connection
    transporter.close()

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('Error sending emails:', error)
    return NextResponse.json(
      { error: `Serverfehler: ${error.message}` },
      { status: 500 }
    )
  }
}
