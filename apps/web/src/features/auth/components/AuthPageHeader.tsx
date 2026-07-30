type AuthPageHeaderProps = {
  title: string;
  subtitle: string;
};

export const AuthPageHeader = ({ title, subtitle }: AuthPageHeaderProps) => (
  <div className="mb-6 space-y-1">
    <h1
      className="text-2xl font-bold text-foreground"
      style={{ fontFamily: "var(--theme-display-font)" }}
    >
      {title}
    </h1>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </div>
);
