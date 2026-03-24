import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageWrapperProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
};

export const PageWrapper = ({
  title,
  subtitle,
  className,
  children,
}: PageWrapperProps) => {
  return (
    <section className={cn("mx-auto w-full max-w-6xl px-4 py-8 sm:px-6", className)}>
      {(title || subtitle) && (
        <header className="mb-6 space-y-1 sm:mb-8">
          {title ? (
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
          ) : null}
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </header>
      )}
      {children}
    </section>
  );
};
