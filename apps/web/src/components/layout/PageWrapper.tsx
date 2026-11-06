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
        <header className="mb-5 space-y-1.5 border-b border-[color:var(--line)] pb-5 sm:mb-7">
          {title ? (
            <h1 className="display-1 text-foreground">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="body max-w-3xl text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
};
