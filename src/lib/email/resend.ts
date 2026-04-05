import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM_EMAIL = "أكاديمية المقام <noreply@m-academy.mabotargagh.online>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://m-academy.mabotargagh.online";

const baseStyle = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #0f0f14;
  color: #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
`;

const headerHtml = `
  <div style="background: linear-gradient(135deg, #1e1b4b 0%, #0f0f14 100%); padding: 32px 40px; border-bottom: 1px solid #1e293b; text-align: center;">
    <div style="display: inline-flex; align-items: center; gap: 10px; margin-bottom: 8px;">
      <div style="width: 36px; height: 36px; background: #f59e0b; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px;">🎵</div>
      <div>
        <div style="font-size: 16px; font-weight: 700; color: #fff; direction: rtl;">أكاديمية المقام</div>
        <div style="font-size: 9px; color: #f59e0b; letter-spacing: 3px;">ACADEMY OF THE MAQAM</div>
      </div>
    </div>
  </div>
`;

const footerHtml = `
  <div style="padding: 24px 40px; border-top: 1px solid #1e293b; text-align: center; color: #64748b; font-size: 12px;">
    <p style="margin: 0;">© ${new Date().getFullYear()} أكاديمية المقام — Academy of the Maqam</p>
    <p style="margin: 4px 0 0;">م-أكاديمية.مبوتارقة.أونلاين | m-academy.mabotargagh.online</p>
  </div>
`;

const btnStyle = (color = "#f59e0b") =>
  `display: inline-block; background: ${color}; color: ${color === "#f59e0b" ? "#0f0f14" : "#fff"}; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; margin-top: 20px;`;

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  if (!resend) {
    console.log("Resend disabled: No API key for welcome email");
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [userEmail],
      subject: "مرحباً بك في أكاديمية المقام 🎵 | Welcome to Academy of the Maqam",
      html: `
        <div style="${baseStyle}">
          ${headerHtml}
          <div style="padding: 40px;">
            <div style="direction: rtl; text-align: right; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #1e293b;">
              <h2 style="color: #f59e0b; font-size: 24px; margin: 0 0 12px;">أهلاً وسهلاً، ${userName}! 🎶</h2>
              <p style="color: #94a3b8; line-height: 1.8; margin: 0 0 12px;">يسعدنا انضمامك إلى أكاديمية المقام — المنصة الأولى لتعليم الموسيقى العربية الأصيلة عبر الإنترنت.</p>
              <p style="color: #94a3b8; line-height: 1.8; margin: 0 0 20px;">سواء كنت مبتدئاً أو محترفاً، ستجد هنا الدورات المناسبة لمستواك في العود والمقامات والنظريات الموسيقية.</p>
              <a href="${APP_URL}/student/courses" style="${btnStyle()}">ابدأ التعلم الآن ←</a>
            </div>
            <div style="direction: ltr; text-align: left;">
              <h2 style="color: #f59e0b; font-size: 20px; margin: 0 0 12px;">Welcome aboard, ${userName}!</h2>
              <p style="color: #94a3b8; line-height: 1.8; margin: 0 0 12px;">We're thrilled to have you join the Academy of the Maqam — your gateway to authentic Arabic music education.</p>
              <p style="color: #94a3b8; line-height: 1.8; margin: 0;">Explore our courses and start your musical journey today.</p>
            </div>
          </div>
          ${footerHtml}
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
      subject: `تم تقييم واجبك "${assignmentTitle}" | Assignment Graded`,
      html: `
        <div style="${baseStyle}">
          ${headerHtml}
          <div style="padding: 40px;">
            <div style="direction: rtl; text-align: right; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #1e293b;">
              <h2 style="color: #f59e0b; font-size: 22px; margin: 0 0 12px;">تم تصحيح واجبك! 📝</h2>
              <p style="color: #94a3b8; margin: 0 0 8px;">قام المعلم بمراجعة واجبك: <strong style="color: #e2e8f0;">${assignmentTitle}</strong></p>
              <div style="background: #1e293b; border-radius: 12px; padding: 16px; margin: 16px 0;">
                <div style="font-size: 28px; font-weight: 800; color: #f59e0b; text-align: center;">${score}</div>
                <div style="color: #64748b; text-align: center; font-size: 12px; margin-top: 4px;">الدرجة</div>
              </div>
              ${feedback ? `<p style="color: #94a3b8; font-style: italic; border-right: 3px solid #f59e0b; padding-right: 12px; margin: 12px 0;">"${feedback.length > 150 ? feedback.substring(0, 150) + '...' : feedback}"</p>` : ''}
              <a href="${link}" style="${btnStyle()}">عرض التقييم الكامل ←</a>
            </div>
            <div style="direction: ltr; text-align: left;">
              <h2 style="color: #f59e0b; font-size: 18px; margin: 0 0 8px;">Assignment Graded</h2>
              <p style="color: #94a3b8; margin: 0 0 12px;">Your submission for <strong style="color: #e2e8f0;">${assignmentTitle}</strong> has been reviewed. Score: <strong style="color: #f59e0b;">${score}</strong></p>
              <a href="${link}" style="color: #f59e0b; text-decoration: none; font-size: 14px;">View full feedback →</a>
            </div>
          </div>
          ${footerHtml}
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
      subject: `تم تسجيلك في "${courseTitle}" 🎶 | Enrolled Successfully`,
      html: `
        <div style="${baseStyle}">
          ${headerHtml}
          <div style="padding: 40px;">
            <div style="direction: rtl; text-align: right; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #1e293b;">
              <h2 style="color: #f59e0b; font-size: 22px; margin: 0 0 12px;">تم تسجيلك بنجاح! 🎉</h2>
              <p style="color: #94a3b8; margin: 0 0 8px;">مرحباً ${studentName}، لقد انضممت إلى دورة:</p>
              <div style="background: #1e293b; border-radius: 12px; padding: 16px 20px; margin: 12px 0; border-right: 3px solid #f59e0b;">
                <strong style="color: #e2e8f0; font-size: 16px;">${courseTitle}</strong>
              </div>
              <p style="color: #94a3b8; margin: 0 0 20px;">ابدأ رحلتك التعليمية الآن وتعلم على وتيرتك الخاصة.</p>
              <a href="${courseLink}" style="${btnStyle()}">انتقل إلى الدورة ←</a>
            </div>
            <div style="direction: ltr; text-align: left;">
              <h2 style="color: #f59e0b; font-size: 18px; margin: 0 0 8px;">You're enrolled, ${studentName}!</h2>
              <p style="color: #94a3b8; margin: 0 0 12px;">You now have full access to <strong style="color: #e2e8f0;">${courseTitle}</strong>. Start learning at your own pace.</p>
              <a href="${courseLink}" style="color: #f59e0b; text-decoration: none; font-size: 14px;">Go to course →</a>
            </div>
          </div>
          ${footerHtml}
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
      subject: `تذكير: موعد تسليم "${assignmentTitle}" غداً ⏰ | Assignment Due Tomorrow`,
      html: `
        <div style="${baseStyle}">
          ${headerHtml}
          <div style="padding: 40px;">
            <div style="direction: rtl; text-align: right; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #1e293b;">
              <h2 style="color: #f59e0b; font-size: 22px; margin: 0 0 12px;">تذكير بموعد الواجب ⏰</h2>
              <p style="color: #94a3b8; margin: 0 0 8px;">لا تنسَ تسليم واجبك:</p>
              <div style="background: #1e293b; border-radius: 12px; padding: 16px 20px; margin: 12px 0; border-right: 3px solid #ef4444;">
                <strong style="color: #e2e8f0; font-size: 16px;">${assignmentTitle}</strong>
                <div style="color: #ef4444; font-size: 13px; margin-top: 4px;">موعد التسليم: غداً</div>
              </div>
              <a href="${link}" style="${btnStyle("#ef4444")}">تسليم الواجب الآن ←</a>
            </div>
            <div style="direction: ltr; text-align: left;">
              <h2 style="color: #ef4444; font-size: 18px; margin: 0 0 8px;">Assignment Due Tomorrow</h2>
              <p style="color: #94a3b8; margin: 0 0 12px;">Don't forget to submit <strong style="color: #e2e8f0;">${assignmentTitle}</strong> before the deadline.</p>
              <a href="${link}" style="color: #ef4444; text-decoration: none; font-size: 14px;">Submit now →</a>
            </div>
          </div>
          ${footerHtml}
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send assignment reminder email:", error);
    return { success: false, error };
  }
}
