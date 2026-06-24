import nodemailer from "nodemailer";

type OtpEmailInput = {
  email: string;
  otp: string;
};

export async function sendOtpEmail({ email, otp }: OtpEmailInput) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log(`[WashDeck OTP] ${email}: ${otp}`);
    return { delivery: "console" as const };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "WashDeck <no-reply@washdeck.local>",
    to: email,
    subject: "Your WashDeck login OTP",
    text: `Your WashDeck login OTP is ${otp}. It expires in 10 minutes.`,
  });

  return { delivery: "email" as const };
}
