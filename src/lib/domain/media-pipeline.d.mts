export type MediaKind = 'portrait' | 'article' | 'documentary';
export type MediaFocus = Readonly<{ x: number; y: number }>;
export type MediaIngestManifest = Readonly<{
  schema_version: '1.0.0';
  id: string;
  kind: MediaKind;
  slug: string;
  source_path: string;
  declared_mime: string;
  alt: string;
  caption: string | null;
  credit: string;
  license: string;
  approved: true;
  author_slug?: string;
  visual_guide_reference?: string;
  focus?: MediaFocus;
}>;
export type MediaInspection = Readonly<{
  mime: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  has_exif: boolean;
  metadata_keys: readonly string[];
}>;
export type DerivativePlan = Readonly<{
  variant: string;
  width: number;
  height: number;
  fit: string;
  format: 'avif' | 'webp' | 'jpeg';
  mime_type: string;
  focus: MediaFocus;
  public_path: string;
  output_path: string;
}>;
