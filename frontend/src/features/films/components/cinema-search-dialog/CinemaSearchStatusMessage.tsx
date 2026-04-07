type CinemaSearchStatusMessageProps = {
  message: string;
};

export const CinemaSearchStatusMessage = ({
  message,
}: CinemaSearchStatusMessageProps) => {
  return (
    <p className="border border-dashed border-border/70 px-3 py-4 font-mono text-xs text-muted-foreground">
      {message}
    </p>
  );
};
