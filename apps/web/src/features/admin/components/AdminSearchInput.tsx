import { Search } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AdminSearchInputProps = InputProps & { wrapperClassName?: string };

export const AdminSearchInput = ({
  wrapperClassName,
  className,
  ...props
}: AdminSearchInputProps) => (
  <div className={cn("relative max-w-sm", wrapperClassName)}>
    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
    <Input className={cn("pl-8", className)} {...props} />
  </div>
);
