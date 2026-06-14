"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";

import { cn } from "@/lib/utils";

type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root> & {
  required?: boolean;
  requiredClassName?: string;
};

function Label({ className, required = false, requiredClassName, children, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "typo-medium-14 flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {required && <RequiredMark className={requiredClassName} />}
    </LabelPrimitive.Root>
  );
}

export { Label, RequiredMark };

function RequiredMark({ className }: { className?: string }) {
  return (
    <span className={cn("text-red-500", className)} aria-label="필수">
      *
    </span>
  );
}
