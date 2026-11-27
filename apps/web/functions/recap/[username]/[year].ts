import { handleLinkPreview } from "../../../link-preview/handler";

// Link-preview meta for the recap story; everyone else gets the SPA as is.
export const onRequestGet = handleLinkPreview;
