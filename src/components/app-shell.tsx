import { Header } from "@/components/header";
import { NavSidebar } from "@/components/nav-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 lg:flex-row lg:px-6">
        <NavSidebar />
        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[2rem] border border-border/70 bg-card/85 shadow-[0_20px_80px_-60px_rgba(17,40,61,0.8)] backdrop-blur">
          <Header />
          <main className="flex-1 px-5 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
