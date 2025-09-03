import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, message } = await request.json()

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Укажите имя и телефон" },
        { status: 400 }
      )
    }

    // Используем Gmail SMTP как fallback, если не настроены другие SMTP
    const host = process.env.SMTP_HOST || "smtp.gmail.com"
    const port = Number(process.env.SMTP_PORT || 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const to = process.env.SMTP_TO || user

    console.log("SMTP настройки:", { host, port, user: user ? "***" : "не задан", pass: pass ? "***" : "не задан", to })

    if (!user || !pass) {
      return NextResponse.json(
        { error: "SMTP не настроен: отсутствуют SMTP_USER или SMTP_PASS" },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    // Проверяем подключение к SMTP серверу
    try {
      await transporter.verify()
      console.log("SMTP подключение успешно")
    } catch (verifyError) {
      console.error("Ошибка проверки SMTP:", verifyError)
      return NextResponse.json(
        { error: `Ошибка подключения к SMTP серверу: ${verifyError.message}` },
        { status: 500 }
      )
    }

    const html = `
      <h2>Новая заявка с сайта vyborplus.ru</h2>
      <p><strong>Имя:</strong> ${name}</p>
      <p><strong>Телефон:</strong> ${phone}</p>
      ${email ? `<p><strong>Email:</strong> ${email}</p>` : ""}
      ${message ? `<p><strong>Сообщение:</strong> ${message}</p>` : ""}
      <hr />
      <p style="color:#666;font-size:12px">${new Date().toLocaleString("ru-RU")}</p>
    `

    const result = await transporter.sendMail({
      from: `Заявка с сайта <${user}>`,
      to,
      subject: `Заявка с сайта: ${name}`,
      html,
    })

    console.log("Email отправлен:", result.messageId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка отправки заявки:", error)
    return NextResponse.json(
      { error: `Ошибка отправки заявки: ${error.message}` },
      { status: 500 }
    )
  }
}
