import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, message } = await request.json()

    // Создаем транспортер для отправки email
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Формируем текст письма
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Отправляем на ту же почту
      subject: `Новая заявка с сайта vyborplus.ru - ${name}`,
      html: `
        <h2>Новая заявка с сайта</h2>
        <p><strong>Имя:</strong> ${name}</p>
        <p><strong>Телефон:</strong> ${phone}</p>
        ${email ? `<p><strong>Email:</strong> ${email}</p>` : ""}
        ${message ? `<p><strong>Сообщение:</strong> ${message}</p>` : ""}
        <p><strong>Дата:</strong> ${new Date().toLocaleString("ru-RU")}</p>
        <p><strong>IP:</strong> ${request.headers.get("x-forwarded-for") || request.ip}</p>
      `,
    }

    // Отправляем email
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка отправки заявки:", error)
    return NextResponse.json(
      { error: "Ошибка отправки заявки" },
      { status: 500 }
    )
  }
}
