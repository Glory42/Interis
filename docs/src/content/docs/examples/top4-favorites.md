---
title: Top 4 Favorites
description: Render separate film and series favorites sections from a single response.
---

Use `/top4` to drive static profile sections without extra API calls.

## Example

```js
async function loadTopFavorites(username) {
  const res = await fetch(`https://api.interis.gorkemkaryol.dev/api/public/${username}/top4`);
  if (!res.ok) throw new Error(`Top picks failed: ${res.status}`);

  const data = await res.json();
  const categories = Object.fromEntries(
    data.categories.map((category) => [category.key, category.items])
  );

  return {
    films: categories.cinema ?? [],
    series: categories.serial ?? [],
  };
}

const { films, series } = await loadTopFavorites('your_username');
```

## Render helper

```js
function toFavoritesMarkup(title, items) {
  return `
    <section>
      <h3>${title}</h3>
      <ul>
        ${items
          .map(
            (item) =>
              `<li data-slot="${item.slot}">${item.title ?? 'Untitled'} (${item.releaseYear ?? 'n/a'})</li>`
          )
          .join('')}
      </ul>
    </section>
  `;
}
```

## Notes

- Keep fallback text for `title` and `releaseYear` when values are `null`.
- Use `slot` to preserve user ranking order.
