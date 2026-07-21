const EXTERNAL_PROTOCOL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

export const normalizeBasePath = (basePath: string | undefined): string => {
  if (!basePath || basePath === '/') return '/';
  return `/${basePath.replace(/^\/+|\/+$/g, '')}`;
};

export const withBasePath = (href: string, basePath = '/'): string => {
  if (!href || href.startsWith('#') || EXTERNAL_PROTOCOL.test(href)) return href;
  if (!href.startsWith('/')) return href;
  const base = normalizeBasePath(basePath);
  if (base === '/') return href;
  if (href === base || href.startsWith(`${base}/`)) return href;
  return href === '/' ? `${base}/` : `${base}${href}`;
};
