import { cn } from "@/core/lib/utils";
import { SidebarTrigger } from "@/core/components/sidebar";
import { ThemeToggle } from "@/core/components/theme-toggle";

const DEBUG = false;

const Header: React.FC = () => {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-1 w-full py-1 border-b",
        {
          "border-2 border-green-500": DEBUG,
        },
      )}
    >
      <SidebarTrigger />
      <ThemeToggle />
    </header>
  );
};

export default Header;
