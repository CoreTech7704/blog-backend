const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendEmail = async (to, subject, html) => {
  try {
    await resend.emails.send({
      from: "Void Work <onboarding@resend.dev>",
      to: process.env.TEST_EMAIL || to,
      subject,
      html,
    });
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
};