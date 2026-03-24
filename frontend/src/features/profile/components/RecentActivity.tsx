import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const RecentActivity = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Social activity feed lands in Phase 2. This area is reserved for follows,
          likes, reviews, and comments.
        </p>
      </CardContent>
    </Card>
  );
};
