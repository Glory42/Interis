import { Input } from "@/components/ui/input";

// Account actions re-check the acting admin's own password on the server.
export const AdminPasswordField = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="block space-y-1 text-xs text-muted-foreground">
    <span>Your password</span>
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      type="password"
      autoComplete="current-password"
      className="h-8 text-sm"
    />
  </label>
);
