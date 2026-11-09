import { SentenceSelect, type SentenceOption } from "@/components/ui/SentenceSelect";
import type { FeedFilter } from "@/features/feed/types";

const options: SentenceOption<FeedFilter>[] = [
  { value: "all", label: "Everything", word: "everything" },
  { value: "movie", label: "Films", word: "films" },
  { value: "serial", label: "TV", word: "TV" },
];

// "Showing everything from people you follow." The underlined word picks films or TV.
export const FeedFilterSentence = ({ filter, onChange }: { filter: FeedFilter; onChange: (filter: FeedFilter) => void }) => (
  <div className="body-s text-muted-foreground">
    {"Showing "}
    <SentenceSelect value={filter} options={options} onChange={onChange} />
    {" from people you follow."}
  </div>
);
