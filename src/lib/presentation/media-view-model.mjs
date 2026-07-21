const rank = Object.freeze({ avif: 0, webp: 1, jpeg: 2, png: 3 });
export const selectVariant = (media, variant) =>
  media?.derivatives
    ?.filter((item) => item.variant === variant)
    .sort((a, b) => rank[a.format] - rank[b.format]) ?? [];
export const createPictureModel = ({ media, variant = 'article', fallbackAlt = null }) => {
  const derivatives = selectVariant(media, variant);
  if (derivatives.length === 0)
    return Object.freeze({
      available: false,
      alt: fallbackAlt ?? media?.alt ?? '',
      sources: [],
      fallback: null,
      width: null,
      height: null,
      credit: null,
      license: null,
    });
  const fallback = derivatives.find((item) => item.format === 'jpeg') ?? derivatives.at(-1);
  const sources = derivatives
    .filter((item) => item.format !== 'jpeg')
    .map((item) =>
      Object.freeze({ src: item.path, type: item.mime_type ?? `image/${item.format}` }),
    );
  return Object.freeze({
    available: true,
    alt: media.alt ?? fallbackAlt ?? '',
    sources: Object.freeze(sources),
    fallback: Object.freeze({ src: fallback.path }),
    width: fallback.width,
    height: fallback.height,
    credit: media.credit,
    license: media.license,
  });
};
export const portraitForAuthor = (registry, slug) => {
  const item = registry.find((entry) => entry.author_slug === slug);
  return item?.status === 'approved' ? item : null;
};
