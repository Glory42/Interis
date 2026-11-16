import { describe, expect, it } from "vitest";
import { isLinkPreviewBot } from "../../../link-preview/bot-detection";

describe("isLinkPreviewBot", () => {
  it.each([
    "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
    "Twitterbot/1.0",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    "TelegramBot (like TwitterBot)",
    "WhatsApp/2.23.20.0 A",
    "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
    "Mozilla/5.0 (compatible; Applebot/0.1; +http://www.apple.com/go/applebot)",
    "http.rb/5.1.1 (Mastodon/4.2.0; +https://mastodon.social/)",
    "Mozilla/5.0 (compatible; Bluesky Cardyb/1.1; +mailto:support@bsky.app)",
    "Mozilla/5.0 (Windows NT 6.1; WOW64) SkypeUriPreview Preview/0.5",
  ])("treats %s as a link-preview bot", (userAgent) => {
    expect(isLinkPreviewBot(userAgent)).toBe(true);
  });

  it.each([
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "",
    null,
  ])("leaves %s alone", (userAgent) => {
    expect(isLinkPreviewBot(userAgent)).toBe(false);
  });
});
