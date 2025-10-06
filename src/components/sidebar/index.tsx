import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { UserHeader } from "./user-header";
import { ThemeToggle } from "../theme-toggle";

export function Sidebar() {
  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "flex sm:flex-col border-t rounded-tl-lg sm:border-t-0 sm:rounded-none rounded-tr-lg inset-shadow-2xs order-2 sm:order-1 border-r bg-muted/10 transition-all duration-300"
          // sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex-1 sm:flex-none p-4 flex gap-3 sm:flex-col sm:justify-between justify-center items-center">
          <div className="flex flex-col items-center gap-3">
            <div className="hidden sm:block sm:py-4">
              <UserHeader />
            </div>
            <SidebarNav />
          </div>
          <div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
