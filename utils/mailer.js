const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const test_email = process.env.TEST_EMAIL;

exports.sendEmail = async (to, subject, html) => {
  try {
    const data = await resend.emails.send({
      from: "Void Work <onboarding@resend.dev>", 
      to: test_email || to,
      subject,
      html,
    });

    console.log("Email sent:", data);
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
};