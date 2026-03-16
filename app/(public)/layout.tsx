import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileDock } from "@/components/MobileDock";
import { RightSidebar } from "@/components/RightSidebar";

export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <LeftSidebar />
      <div className="flex min-h-screen flex-1 flex-col pl-0 md:pl-14">
        <main className="flex-1 pr-0 pb-16 md:pb-0 md:pr-64">
          <div className="mx-auto max-w-2xl px-6 py-12">{children}</div>
        </main>
        <MobileDock />
      </div>
      <RightSidebar />
    </div>
  );
}
