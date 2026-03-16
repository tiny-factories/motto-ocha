import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileDock } from "@/components/MobileDock";
import { RightSidebar } from "@/components/RightSidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <LeftSidebar />
      <div className="flex min-h-screen flex-1 flex-col pl-0 md:pl-14">
        <main className="flex-1 overflow-auto pr-0 pb-16 md:pb-0 md:pr-64">
          <div className="mx-auto max-w-2xl px-6 py-12">{children}</div>
        </main>
        <MobileDock />
      </div>
      <RightSidebar />
    </div>
  );
}
