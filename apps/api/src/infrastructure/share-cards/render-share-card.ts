import satori from "satori";
import { renderAsync } from "@resvg/resvg-js";
import { loadCardFonts } from "./share-card-fonts";
import type { CardNode } from "./share-card-elements";
import { CARD_HEIGHT, CARD_WIDTH } from "./share-card-theme";

// satori lays the card out as SVG (text as paths), resvg rasterises it off the main thread.
export const renderSharePng = async (node: CardNode): Promise<Buffer> => {
  const svg = await satori(node as unknown as Parameters<typeof satori>[0], {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: await loadCardFonts(),
  });
  const rendered = await renderAsync(svg, { font: { loadSystemFonts: false } });
  return rendered.asPng();
};
