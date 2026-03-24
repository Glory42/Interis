import { Card, CardContent } from "@/components/ui/card";

type FeedItemProps = {
  label: string;
  detail: string;
};

export const FeedItem = ({ label, detail }: FeedItemProps) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </CardContent>
  </Card>
);
