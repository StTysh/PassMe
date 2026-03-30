import { Header } from "@/components/header";
import { NavSidebar } from "@/components/nav-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
