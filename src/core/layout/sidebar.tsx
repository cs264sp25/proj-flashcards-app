import {
  GalleryVerticalEnd,
  FlaskConical,
  Home,
  BotMessageSquare,
  Bot,
  BookOpen,
  Bell,
} from "lucide-react";
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
import { useRouter } from "@/core/hooks/use-router";
import { Page } from "@/core/config/router";
import { SignOut } from "@/auth/components/sign-out";
import UnreadCount from "@/notifications/components/unread-count";

// Menu items.
const items = [
  {
    title: "Home",
    page: "home",
    icon: Home,
  },
  {
    title: "Decks",
    page: "decks",
    icon: GalleryVerticalEnd,
  },
  {
    title: "Chat",
    page: "chats",
    icon: BotMessageSquare,
  },
  {
    title: "Studies",
    page: "studies",
    icon: BookOpen,
  },
  {
    title: "Demo",
    page: "demo",
    icon: FlaskConical,
  },
  {
    title: "Assistants",
    page: "assistants",
    icon: Bot,
  },
  {
    title: "Notifications",
    page: "notifications",
    icon: Bell,
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
                      {item.title === "Notifications" ? (
                        <span>
                          Notifications <UnreadCount />
                        </span>
                      ) : (
                        <span>{item.title}</span>
                      )}
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
