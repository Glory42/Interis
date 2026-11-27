import satori from "satori";
import { renderAsync } from "@resvg/resvg-js";
import jpeg from "jpeg-js";
import { loadCardFonts } from "./share-card-fonts";
import type { CardNode } from "./share-card-elements";
import { CARD_HEIGHT, CARD_WIDTH } from "./share-card-theme";

// Photographic artwork made PNG cards ~1 MB, past what WhatsApp and others will unfurl;
// JPEG at this quality keeps every card near 100 KB with no visible loss on text.
const JPEG_QUALITY = 82;

// satori lays the card out as SVG (text as paths), resvg rasterises it off the main thread,
// and jpeg-js (pure JS, so no native build) encodes the opaque RGBA pixels.
export const renderShareImage = async (
  node: CardNode,
  size: { width: number; height: number } = { width: CARD_WIDTH, height: CARD_HEIGHT },
): Promise<Buffer> => {
  const svg = await satori(node as unknown as Parameters<typeof satori>[0], {
    width: size.width,
    height: size.height,
    fonts: await loadCardFonts(),
  });
  const rendered = await renderAsync(svg, { font: { loadSystemFonts: false } });
  const encoded = jpeg.encode({ data: rendered.pixels, width: rendered.width, height: rendered.height }, JPEG_QUALITY);
  return Buffer.from(encoded.data);
};
