import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";
import SessionWrapper from "@/components/dashboard/SessionWrapper";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <SessionWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex">
        <DashboardNav user={session.user} />
        <main className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </SessionWrapper>
  );
}
