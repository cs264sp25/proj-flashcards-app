import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/core/lib/utils";
import { buttonVariants } from "@/core/components/button-variants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/core/components/tooltip";

interface TooltipButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  tooltipContent: React.ReactNode;
  asChild?: boolean;
}

function TooltipButton({
  className,
  variant,
  size,
  tooltipContent,
  asChild = false,
  ...props
}: TooltipButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export { TooltipButton };
