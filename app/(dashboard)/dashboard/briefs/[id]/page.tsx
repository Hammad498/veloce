import { auth } from "@/lib/auth";
import BriefDetail from "@/components/dashboard/BriefDetail";

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userRole = session?.user?.role;
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      <BriefDetail briefId={id} userRole={userRole} />
    </div>
  );
}
