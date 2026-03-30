import { Header } from "@/components/header";
import { NavSidebar } from "@/components/nav-sidebar";
import { hasGeminiApiKey } from "@/lib/env";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex">
        <NavSidebar />
      </div>
      <div className="flex flex-1 flex-col">
        <Header geminiReady={hasGeminiApiKey} />
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-7xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
