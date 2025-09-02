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

    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT || 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const to = process.env.SMTP_TO || user

    if (!host || !port || !user || !pass || !to) {
      return NextResponse.json(
        { error: "SMTP не настроен на сервере" },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    const html = `
      <h2>Новая заявка с сайта vyborplus.ru</h2>
      <p><strong>Имя:</strong> ${name}</p>
      <p><strong>Телефон:</strong> ${phone}</p>
      ${email ? `<p><strong>Email:</strong> ${email}</p>` : ""}
      ${message ? `<p><strong>Сообщение:</strong> ${message}</p>` : ""}
      <hr />
      <p style="color:#666;font-size:12px">${new Date().toLocaleString("ru-RU")}</p>
    `

    await transporter.sendMail({
      from: `Заявка с сайта <${user}>`,
      to,
      subject: `Заявка с сайта: ${name}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка отправки заявки:", error)
    return NextResponse.json(
      { error: "Ошибка отправки заявки" },
      { status: 500 }
    )
  }
}
