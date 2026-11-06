// Theme metadata for the picker. Colours live only in src/index.css under
// :root[data-theme-id="…"]; this file only names and previews each theme.
window.__THIS_IS_CINEMA_THEME_REGISTRY__ = {
  "rose-pine": {
    id: "rose-pine",
    label: "Rose Pine",
    description: "The real Rosé Pine palette: iris for actions, rose for films, foam for TV.",
    preview: {
      mode: "dark",
      swatches: ["#191724", "#1f1d2e", "#c4a7e7", "#ebbcba"],
    },
  },
  "null-log": {
    id: "null-log",
    label: "NULL://LOG",
    description:
      "Pure-black AMOLED terminal: green phosphor for actions, amber for films, cyan for TV.",
    preview: {
      mode: "dark",
      swatches: ["#000000", "#0a0a0a", "#00ff88", "#ffb000"],
    },
  },
  nitrate: {
    id: "nitrate",
    label: "Nitrate",
    description:
      "Old nitrate film stock: brown-black celluloid, amber projector light, red-orange for films and verdigris for TV.",
    preview: {
      mode: "dark",
      swatches: ["#14100c", "#1c1712", "#f2a33a", "#e2765a"],
    },
  },
  marquee: {
    id: "marquee",
    label: "Marquee",
    description:
      "Warm cinema-lobby light theme — cream and parchment with marquee crimson and brass-gold accents.",
    preview: {
      mode: "light",
      swatches: ["#faf6ee", "#ffffff", "#b8123a", "#9a5b12"],
    },
  },
};

window.__THIS_IS_CINEMA_DEFAULT_THEME_ID__ = "rose-pine";
