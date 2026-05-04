---
title: Portfolio Widget
description: Build a simple portfolio block with profile and top picks.
---

This example renders a minimal profile + favorites widget from two endpoints.

## Data flow

1. Fetch `/profile`
2. Fetch `/top4`
3. Render user header + `cinema` and `serial` sections

## Example

```html
<section id="interis-widget"></section>

<script type="module">
  const username = 'your_username';
  const base = 'https://api.interis.gorkemkaryol.dev';

  const [profileRes, topRes] = await Promise.all([
    fetch(`${base}/api/public/${username}/profile`),
    fetch(`${base}/api/public/${username}/top4`),
  ]);

  if (!profileRes.ok || !topRes.ok) {
    throw new Error('Interis widget request failed');
  }

  const profile = await profileRes.json();
  const top4 = await topRes.json();

  const byKey = Object.fromEntries(top4.categories.map((category) => [category.key, category.items]));

  const root = document.querySelector('#interis-widget');
  root.innerHTML = `
    <h2>${profile.displayUsername ?? profile.username}</h2>
    <p>${profile.stats.reviewCount} reviews · ${profile.stats.entryCount} logs</p>

    <h3>Top 4 Films</h3>
    <ul>${(byKey.cinema ?? []).map((item) => `<li>${item.title ?? 'Untitled'}</li>`).join('')}</ul>

    <h3>Top 4 Series</h3>
    <ul>${(byKey.serial ?? []).map((item) => `<li>${item.title ?? 'Untitled'}</li>`).join('')}</ul>
  `;
</script>
```

## Production tips

- Cache responses in your own layer if traffic is frequent.
- Keep client-side requests under rate limits.
- If CORS blocks browser calls, proxy via your server.
