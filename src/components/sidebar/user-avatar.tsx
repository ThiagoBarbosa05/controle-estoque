import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";

const getUserInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Componente do Avatar simples
export async function UserAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const sizeClasses = size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-sm";

  return (
    <div
      className={cn(
        "rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium",
        sizeClasses
      )}
    >
      {session?.user?.name ? getUserInitials(session.user.name) : "U"}
    </div>
  );
}
