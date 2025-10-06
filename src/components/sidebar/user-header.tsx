import { cn } from "@/lib/utils";
import { UserAvatar } from "./user-avatar";

// Componente do header do usuário
export function UserHeader() {
  return (
    <div className={cn("flex items-center justify-center gap-2")}>
      <UserAvatar />
    </div>
  );
}
