import { Sidebar } from "@/components/sidebar";
import { UserHeader } from "@/components/sidebar/user-header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex sm:flex-row flex-col h-screen bg-background">
      {/* Conteúdo principal */}
      <Sidebar />
      <div className="flex-1 order-1 sm:order-2 flex flex-col overflow-hidden">
        {/* Header mobile */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-background">
          <h1 className="text-lg font-semibold">Controle de Estoque</h1>
          <div>
            <UserHeader />
          </div>
        </header>

        {/* Área de conteúdo */}
        <main className="flex-1 overflow-auto">
          <div className="p-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
