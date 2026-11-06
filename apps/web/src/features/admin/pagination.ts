export const ADMIN_PAGE_SIZE = 20;

export type AdminPage = { limit: number; offset: number };

export const appendPageParams = (params: URLSearchParams, page?: AdminPage): void => {
  if (!page) return;
  params.set("limit", String(page.limit));
  params.set("offset", String(page.offset));
};
