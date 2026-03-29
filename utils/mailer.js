const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendEmail = async (to, subject, html) => {
  try {
    const data = await resend.emails.send({
      from: "Void Work <onboarding@resend.dev>", 
      to: TEST_EMAIL || to,
      subject,
      html,
    });

    console.log("Email sent:", data);
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
};