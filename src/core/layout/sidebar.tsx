import { Home } from "lucide-react";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/core/components/sidebar";
import { SignOut } from "@/auth/components/sign-out";
import { useRouter } from "@/core/hooks/use-router";
import { Page } from "@/core/config/router";

// Menu items.
const items = [
  {
    title: "Home",
    page: "home",
    icon: Home,
  },
];

function Sidebar() {
  const { getPath } = useRouter();

  return (
    <SidebarRoot>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Flashcards App</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={getPath(item.page as Page) || "/"}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <SignOut />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </SidebarRoot>
  );
}

export default Sidebar;
