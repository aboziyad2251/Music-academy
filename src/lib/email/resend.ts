import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM_EMAIL = "أكاديمية المقام <noreply@m-academy.mabotargagh.online>";

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  if (!resend) {
    console.log("Resend disabled: No API key for welcome email");
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [userEmail],
      subject: "Welcome to Music Online Academy! 🎵",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome aboard, ${userName}!</h2>
          <p>We're thrilled to have you join the Music Online Academy.</p>
          <p>Whether you're picking up an instrument for the first time or mastering advanced theory, you're in the right place.</p>
          <p>Get started by <a href="${process.env.NEXT_PUBLIC_APP_URL}/courses">exploring our courses catalog</a>.</p>
          <br/>
          <p>Happy playing,<br/>The Music Academy Team</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { success: false, error };
  }
}

export async function sendGradeNotification(
  studentEmail: string,
  assignmentTitle: string,
  score: number,
  feedback: string,
  link: string
) {
  if (!resend) return { success: true, simulated: true };

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [studentEmail],
      subject: `Your assignment "${assignmentTitle}" has been graded!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Assignment Graded</h2>
          <p>Your teacher has reviewed your submission for <strong>${assignmentTitle}</strong>.</p>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin-top: 0; color: #64748b;">Feedback Preview:</p>
            <p style="font-style: italic;">"${feedback.length > 100 ? feedback.substring(0, 100) + '...' : feedback}"</p>
          </div>
          <a href="${link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Full Grade</a>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send grade notification:", error);
    return { success: false, error };
  }
}

export async function sendEnrollmentEmail(
  studentEmail: string,
  studentName: string,
  courseTitle: string,
  courseLink: string
) {
  if (!resend) return { success: true, simulated: true };

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [studentEmail],
      subject: `You're enrolled in "${courseTitle}" 🎶`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You're in, ${studentName}!</h2>
          <p>You've been successfully enrolled in <strong>${courseTitle}</strong>.</p>
          <p>Head over to your course and start learning at your own pace.</p>
          <a href="${courseLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">Go to Course</a>
          <br/><br/>
          <p>Happy learning,<br/>The Music Academy Team</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send enrollment email:", error);
    return { success: false, error };
  }
}

export async function sendAssignmentReminder(
  studentEmail: string,
  assignmentTitle: string,
  link: string
) {
  if (!resend) return { success: true, simulated: true };

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [studentEmail],
      subject: `Reminder: Assignment due tomorrow for ${assignmentTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Assignment Reminder ⏰</h2>
          <p>Just a quick reminder that your assignment <strong>${assignmentTitle}</strong> is due in 24 hours.</p>
          <p>Don't forget to submit your work on time!</p>
          <a href="${link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">Go to Assignment</a>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send assignment reminder email:", error);
    return { success: false, error };
  }
}
