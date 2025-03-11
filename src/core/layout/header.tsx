import { cn } from "@/core/lib/utils";
import { SidebarTrigger } from "@/core/components/sidebar";

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
      <div
        className={cn(
          "flex items-center justify-start w-full font-light text-muted-foreground",
          {
            "border-2 border-blue-500": DEBUG,
          },
        )}
      >
        <SidebarTrigger />
      </div>
    </header>
  );
};

export default Header;
