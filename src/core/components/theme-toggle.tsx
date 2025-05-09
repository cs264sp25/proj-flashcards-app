import { Computer, Moon, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/dropdown-menu";
import { TooltipButton } from "@/core/components/tooltip-button";
import { useTheme } from "@/core/hooks/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Determine which theme is active
  const isLightTheme = theme === "light";
  const isDarkTheme = theme === "dark";
  const isSystemTheme = theme === "system";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TooltipButton
          variant="ghost"
          size="icon"
          className="relative w-7 h-7 flex-shrink-0"
          tooltipContent="Toggle theme"
        >
          <Sun
            className={`transition-all duration-150 ease-in-out absolute 
              ${isLightTheme ? "rotate-0 scale-100" : "rotate-90 scale-0"}`}
          />
          <Moon
            className={`transition-all duration-150 ease-in-out absolute 
              ${isDarkTheme ? "rotate-0 scale-100" : "rotate-90 scale-0"}`}
          />
          <Computer
            className={`transition-all duration-150 ease-in-out absolute 
              ${isSystemTheme ? "rotate-0 scale-100" : "rotate-90 scale-0"}`}
          />
          <span className="sr-only">Toggle theme</span>
        </TooltipButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
