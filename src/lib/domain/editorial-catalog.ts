
export type EditorialCatalogIndex = Readonly<{
  authorIds: ReadonlySet<string>;
  channelIds: ReadonlySet<string>;
  frameIds: ReadonlySet<string>;
  frameChannelById: ReadonlyMap<string, string>;
}>;

export type CatalogSource = Readonly<{
  authors: readonly Readonly<{ author_id: string }>[];
  channels: readonly Readonly<{ channel_id: string }>[];
  frames: readonly Readonly<{ frame_id: string; channel_id: string }>[];
}>;

export const buildEditorialCatalogIndex = (source: CatalogSource): EditorialCatalogIndex => ({
  authorIds: new Set(source.authors.map((author) => author.author_id)),
  channelIds: new Set(source.channels.map((channel) => channel.channel_id)),
  frameIds: new Set(source.frames.map((frame) => frame.frame_id)),
  frameChannelById: new Map(source.frames.map((frame) => [frame.frame_id, frame.channel_id])),
});
