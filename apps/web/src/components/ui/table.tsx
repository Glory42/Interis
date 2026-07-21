import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Table = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) => (
  <div className="overflow-x-auto">
    <table className={cn("w-full border-collapse text-sm", className)} {...props} />
  </div>
);

export const TableHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead
    className={cn(
      "sticky top-0 z-10 bg-card/95 backdrop-blur-sm",
      className,
    )}
    {...props}
  />
);

export const TableBody = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("[&_tr:nth-child(even)]:bg-secondary/20", className)} {...props} />
);

export const TableRow = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn(
      "border-b border-border/40 transition-colors last:border-0 hover:bg-secondary/35",
      className,
    )}
    {...props}
  />
);

export const TableHead = ({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      "border-b border-border/60 px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground",
      className,
    )}
    {...props}
  />
);

export const TableCell = ({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-3 py-2 align-middle", className)} {...props} />
);
