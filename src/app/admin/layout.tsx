import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto h-[calc(100vh-56px)] md:h-screen">
        <div className="h-full p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}