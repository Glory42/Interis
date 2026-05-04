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
    <section className={cn("mx-auto w-full max-w-400 px-4 py-8", className)}>
      {(title || subtitle) && (
        <header className="mb-5 space-y-1.5 border-b border-border/60 pb-5 sm:mb-7">
          {title ? (
            <h1 className="font-mono text-[clamp(1.4rem,4vw,2rem)] font-bold text-foreground">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="max-w-3xl font-mono text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
};
