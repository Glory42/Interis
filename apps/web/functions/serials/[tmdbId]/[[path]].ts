import { handleLinkPreview } from "../../../link-preview/handler";

// Link-preview meta for bots; everyone else gets the SPA as is.
export const onRequestGet = handleLinkPreview;
