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
    <section
      className={cn(
        "mx-auto w-full max-w-[min(96rem,100vw)] px-3 py-6 sm:px-5 sm:py-8 lg:px-8",
        className,
      )}
    >
      {(title || subtitle) && (
        <header className="mb-5 space-y-1.5 sm:mb-7">
          {title ? (
            <h1 className="text-[clamp(1.4rem,4vw,2rem)] font-bold text-foreground">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
};
