type AuthPageHeaderProps = {
  title: string;
  subtitle: string;
};

export const AuthPageHeader = ({ title, subtitle }: AuthPageHeaderProps) => (
  <div className="mb-6">
    <h1 className="display-2 leading-tight text-foreground">{title}</h1>
    <p className="body mt-1.5 text-muted-foreground">{subtitle}</p>
  </div>
);
