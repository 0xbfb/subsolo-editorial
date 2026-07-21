export type RuntimeConfig = Readonly<{
  timezone: string;
  siteUrl: string;
}>;

export const readRuntimeConfig = (
  env: Readonly<Record<string, string | undefined>>,
): RuntimeConfig =>
  Object.freeze({
    timezone: env.SUBSOLO_TIMEZONE ?? 'America/Sao_Paulo',
    siteUrl: env.SUBSOLO_SITE_URL ?? 'http://localhost:4321',
  });
