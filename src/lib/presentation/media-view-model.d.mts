export type MediaDerivativeView = Readonly<{
  path: string;
  variant?: string;
  format: 'avif' | 'webp' | 'jpeg' | 'png';
  mime_type?: string;
  width: number;
  height: number;
}>;
export type MediaView = Readonly<{
  alt: string;
  credit: string;
  license: string;
  derivatives: readonly MediaDerivativeView[];
}>;
export function selectVariant(
  media: MediaView | null | undefined,
  variant: string,
): readonly MediaDerivativeView[];
export function createPictureModel(input: {
  media: MediaView | null | undefined;
  variant?: string;
  fallbackAlt?: string | null;
}): Readonly<{
  available: boolean;
  alt: string;
  sources: readonly Readonly<{ src: string; type: string }>[];
  fallback: Readonly<{ src: string }> | null;
  width: number | null;
  height: number | null;
  credit: string | null;
  license: string | null;
}>;
export function portraitForAuthor<T extends { author_slug: string; status: string }>(
  registry: readonly T[],
  slug: string,
): T | null;
