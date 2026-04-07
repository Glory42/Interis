import type { ComponentProps } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

type LogMediaLoginTriggerProps = {
  triggerLabel?: string;
  triggerClassName?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerSize?: ComponentProps<typeof Button>["size"];
};

export const LogMediaLoginTrigger = ({
  triggerLabel,
  triggerClassName,
  triggerVariant,
  triggerSize,
}: LogMediaLoginTriggerProps) => {
  return (
    <Button
      asChild
      variant={triggerVariant ?? "outline"}
      size={triggerSize ?? "sm"}
      className={triggerClassName}
    >
      <Link to="/login" viewTransition>
        {triggerLabel ? `Login to ${triggerLabel.toLowerCase()}` : "Login to review"}
      </Link>
    </Button>
  );
};
