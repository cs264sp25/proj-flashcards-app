import { cn } from "@/core/lib/utils";

const DEBUG = false;

const Footer: React.FC = () => {
  return (
    <footer
      className={cn("w-full flex flex-col p-2 border-t", {
        "border-2 border-yellow-500": DEBUG,
      })}
    >
      <p className="text-sm text-muted-foreground font-light text-center sm:text-left">
        Practical Gen AI Course © Spring 2025
      </p>
    </footer>
  );
};

export default Footer;
