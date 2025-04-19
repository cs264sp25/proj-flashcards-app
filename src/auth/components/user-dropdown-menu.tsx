import { ChevronUp, CircleUser, LogOut, User2 } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/core/components/sidebar";
import { useRouter } from "@/core/hooks/use-router";

import { useQueryUser } from "@/auth/hooks/use-query-user";

const UserDropdownMenuInSidebar = () => {
  const { data: user, loading, error } = useQueryUser();
  const { signOut } = useAuthActions();
  const { getPath } = useRouter();

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading || error) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              <Avatar className="w-6 h-6">
                <AvatarImage src={user.image} />
                <AvatarFallback>
                  <CircleUser className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              {user.displayName || user.name || user.email || "User"}
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenuItem asChild>
              <a href={getPath("account") || "/"}>
                <User2 />
                <span>Account</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default UserDropdownMenuInSidebar;
