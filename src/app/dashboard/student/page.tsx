import { redirect } from "next/navigation";

export default function DashboardStudentRedirect() {
  redirect("/student/dashboard");
}
