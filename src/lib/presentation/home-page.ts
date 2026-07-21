export type VisualStatusKind = 'developing' | 'confirmed' | 'analysis' | 'document' | 'corrected';

export interface NavigationItem {
  readonly label: string;
  readonly href: string;
  readonly current: boolean;
  readonly available: boolean;
}

export interface StorySummary {
  readonly channel: string;
  readonly title: string;
  readonly summary: string;
  readonly href?: string;
}

export interface HomePageData {
  readonly pageTitle: string;
  readonly description: string;
  readonly dateLabel: readonly [string, string];
  readonly closingLabel: string;
  readonly breadcrumbs: readonly string[];
  readonly navigation: readonly NavigationItem[];
  readonly hero: {
    readonly channel: string;
    readonly state: string;
    readonly stateKind: VisualStatusKind;
    readonly title: string;
    readonly summary: string;
    readonly time: string;
    readonly readingTime: string;
    readonly author: string;
    readonly href: string;
  };
  readonly sideStories: readonly StorySummary[];
  readonly transmissions: readonly StorySummary[];
  readonly dailyEdition: {
    readonly eyebrow: string;
    readonly title: readonly [string, string];
    readonly summary: string;
    readonly items: readonly string[];
    readonly href: string;
  };
}

const fail = (message: string): never => {
  throw new Error(`Jornal Concreto fixture inválida: ${message}`);
};

const asRecord = (value: unknown, path: string): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    fail(`${path} deve ser um objeto`);
  return value as Record<string, unknown>;
};

const asArray = (value: unknown, path: string): readonly unknown[] => {
  if (!Array.isArray(value)) fail(`${path} deve ser uma lista`);
  return value as readonly unknown[];
};

const nonEmptyString = (value: unknown, path: string): string => {
  if (typeof value !== 'string' || value.trim() === '') fail(`${path} deve ser texto não vazio`);
  return value as string;
};

const booleanValue = (value: unknown, path: string): boolean => {
  if (typeof value !== 'boolean') fail(`${path} deve ser booleano`);
  return value as boolean;
};

const tuple2 = (value: unknown, path: string): readonly [string, string] => {
  const items = asArray(value, path);
  if (items.length !== 2) fail(`${path} deve ter duas linhas`);
  return Object.freeze([
    nonEmptyString(items[0], `${path}[0]`),
    nonEmptyString(items[1], `${path}[1]`),
  ]) as readonly [string, string];
};

const stringList = (value: unknown, path: string): readonly string[] =>
  Object.freeze(
    asArray(value, path).map((item, index) => nonEmptyString(item, `${path}[${index}]`)),
  );

const storyList = (value: unknown, path: string): readonly StorySummary[] =>
  Object.freeze(
    asArray(value, path).map((item, index) => {
      const record = asRecord(item, `${path}[${index}]`);
      const href =
        typeof record.href === 'string' && record.href.trim() !== '' ? record.href : null;
      return Object.freeze({
        channel: nonEmptyString(record.channel, `${path}[${index}].channel`),
        title: nonEmptyString(record.title, `${path}[${index}].title`),
        summary: nonEmptyString(record.summary, `${path}[${index}].summary`),
        ...(href === null ? {} : { href }),
      });
    }),
  );

export const parseHomePageData = (value: unknown): HomePageData => {
  const root = asRecord(value, 'raiz');
  const hero = asRecord(root.hero, 'hero');
  const dailyEdition = asRecord(root.dailyEdition, 'dailyEdition');
  const stateKind = nonEmptyString(hero.stateKind, 'hero.stateKind');
  const allowedStates: readonly VisualStatusKind[] = [
    'developing',
    'confirmed',
    'analysis',
    'document',
    'corrected',
  ];
  if (!allowedStates.includes(stateKind as VisualStatusKind))
    fail('hero.stateKind não é reconhecido');

  const navigation = Object.freeze(
    asArray(root.navigation, 'navigation').map((item, index): NavigationItem => {
      const record = asRecord(item, `navigation[${index}]`);
      return Object.freeze({
        label: nonEmptyString(record.label, `navigation[${index}].label`),
        href: nonEmptyString(record.href, `navigation[${index}].href`),
        current: booleanValue(record.current, `navigation[${index}].current`),
        available: booleanValue(record.available, `navigation[${index}].available`),
      });
    }),
  );

  const parsed = {
    pageTitle: nonEmptyString(root.pageTitle, 'pageTitle'),
    description: nonEmptyString(root.description, 'description'),
    dateLabel: tuple2(root.dateLabel, 'dateLabel'),
    closingLabel: nonEmptyString(root.closingLabel, 'closingLabel'),
    breadcrumbs: stringList(root.breadcrumbs, 'breadcrumbs'),
    navigation,
    hero: Object.freeze({
      channel: nonEmptyString(hero.channel, 'hero.channel'),
      state: nonEmptyString(hero.state, 'hero.state'),
      stateKind: stateKind as VisualStatusKind,
      title: nonEmptyString(hero.title, 'hero.title'),
      summary: nonEmptyString(hero.summary, 'hero.summary'),
      time: nonEmptyString(hero.time, 'hero.time'),
      readingTime: nonEmptyString(hero.readingTime, 'hero.readingTime'),
      author: nonEmptyString(hero.author, 'hero.author'),
      href: nonEmptyString(hero.href, 'hero.href'),
    }),
    sideStories: storyList(root.sideStories, 'sideStories'),
    transmissions: storyList(root.transmissions, 'transmissions'),
    dailyEdition: Object.freeze({
      eyebrow: nonEmptyString(dailyEdition.eyebrow, 'dailyEdition.eyebrow'),
      title: tuple2(dailyEdition.title, 'dailyEdition.title'),
      summary: nonEmptyString(dailyEdition.summary, 'dailyEdition.summary'),
      items: stringList(dailyEdition.items, 'dailyEdition.items'),
      href: nonEmptyString(dailyEdition.href, 'dailyEdition.href'),
    }),
  } satisfies HomePageData;

  return Object.freeze(parsed);
};
