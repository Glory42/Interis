---
title: cURL
description: Endpoint-by-endpoint cURL examples for the Interis public API.
---

Set your values first:

```bash
BASE_URL="https://api.interis.gorkemkaryol.dev"
USERNAME="your_username"
```

## Profile

```bash
curl "$BASE_URL/api/public/$USERNAME/profile"
```

## Top 4

```bash
curl "$BASE_URL/api/public/$USERNAME/top4"
```

## Recent

```bash
curl "$BASE_URL/api/public/$USERNAME/recent?limit=10"
```

## Activity

```bash
curl "$BASE_URL/api/public/$USERNAME/activity?limit=30"
```

## Reviews

```bash
curl "$BASE_URL/api/public/$USERNAME/reviews?limit=50"
```

## Lists

```bash
curl "$BASE_URL/api/public/$USERNAME/lists?limit=20"
```

## Likes

```bash
curl "$BASE_URL/api/public/$USERNAME/likes?limit=20"
```

## Watchlist

```bash
curl "$BASE_URL/api/public/$USERNAME/watchlist?limit=20"
```

## Diary

```bash
curl "$BASE_URL/api/public/$USERNAME/diary?limit=20"
```

## Check headers (rate-limit visibility)

```bash
curl -i "$BASE_URL/api/public/$USERNAME/profile"
```

You should see standard rate limit headers from `express-rate-limit` and `Cache-Control: no-store`.
