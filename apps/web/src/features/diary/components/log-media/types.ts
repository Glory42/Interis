// Every log is a new diary entry (and any review written with it a new
// review, #72), so the form starts blank apart from the viewer's current
// rating and whether they've logged the title before.
export type LogMediaInitialState = {
  rating: number | null;
  rewatch: boolean;
};
