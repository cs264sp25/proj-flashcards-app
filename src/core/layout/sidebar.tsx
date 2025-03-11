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

// Menu items.
const items = [
  {
    title: "Home",
    page: "home",
    icon: Home,
  },
];

// This is a stub until we implement client-side routing
function getPath(pageName: string) {
  return `/${pageName.toLowerCase()}`;
}

function Sidebar() {
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
                    <a href={getPath(item.page) || "/"}>
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
      <SidebarFooter></SidebarFooter>
      <SidebarRail />
    </SidebarRoot>
  );
}

export default Sidebar;
