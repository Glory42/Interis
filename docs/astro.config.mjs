// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.interis.gorkemkaryol.dev',
	integrations: [
		starlight({
			title: 'Interis Docs',
			description:
				'Reference documentation for the Interis public, read-only API.',
			customCss: ['./src/styles/custom.css'],
			components: {
				ThemeProvider: './src/components/InterisThemeProvider.astro',
				ThemeSelect: './src/components/InterisThemeSelect.astro',
			},
			sidebar: [
				{
					label: 'Start Here',
					items: [
						{ label: 'Getting Started', link: '/' },
						{ label: 'API Overview', slug: 'api/overview' },
					],
				},
				{
					label: 'Public Endpoints',
					items: [
						{ label: 'Profile', slug: 'api/endpoints/profile' },
						{ label: 'Top 4', slug: 'api/endpoints/top4' },
						{ label: 'Recent', slug: 'api/endpoints/recent' },
						{ label: 'Reviews', slug: 'api/endpoints/reviews' },
						{ label: 'Lists', slug: 'api/endpoints/lists' },
						{ label: 'Likes', slug: 'api/endpoints/likes' },
						{ label: 'Watchlist', slug: 'api/endpoints/watchlist' },
						{ label: 'Diary', slug: 'api/endpoints/diary' },
						{ label: 'Activity', slug: 'api/endpoints/activity' },
					],
				},
				{
					label: 'Examples',
					items: [
						{ label: 'JavaScript / fetch', slug: 'examples/javascript-fetch' },
						{ label: 'cURL', slug: 'examples/curl' },
						{ label: 'Portfolio Widget', slug: 'examples/portfolio-widget' },
						{ label: 'Recent Reviews Panel', slug: 'examples/recent-reviews-panel' },
						{ label: 'Top 4 Favorites', slug: 'examples/top4-favorites' },
					],
				},
				{
					label: 'Reference Notes',
					items: [
						{ label: 'Data Shapes', slug: 'reference/data-shapes' },
						{
							label: 'Errors & Empty States',
							slug: 'reference/errors-and-empty-states',
						},
						{ label: 'Rate Limits', slug: 'reference/rate-limits' },
						{ label: 'FAQ', slug: 'reference/faq' },
						{ label: 'Future Notes', slug: 'reference/future-notes' },
					],
				},
			],
		}),
	],
});
