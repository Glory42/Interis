// A list is user-curated (searched + added one at a time), so this ceiling
// is well above any realistic use — it exists purely to bound unbounded
// growth from a buggy or abusive client hammering the add-item endpoint.
export const MAX_LIST_ITEMS = 500;
