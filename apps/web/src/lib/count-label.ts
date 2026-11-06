export const formatCountLabel = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count.toLocaleString("en-US")} ${count === 1 ? singular : plural}`;
