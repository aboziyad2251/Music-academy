import { redirect } from "next/navigation";

export default function DashboardTeacherRedirect() {
  redirect("/teacher/dashboard");
}
