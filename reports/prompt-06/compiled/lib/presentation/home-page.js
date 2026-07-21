const fail = (message) => {
  throw new Error(`Jornal Concreto fixture inválida: ${message}`);
};
const asRecord = (value, path) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    fail(`${path} deve ser um objeto`);
  return value;
};
const asArray = (value, path) => {
  if (!Array.isArray(value)) fail(`${path} deve ser uma lista`);
  return value;
};
const nonEmptyString = (value, path) => {
  if (typeof value !== 'string' || value.trim() === '') fail(`${path} deve ser texto não vazio`);
  return value;
};
const booleanValue = (value, path) => {
  if (typeof value !== 'boolean') fail(`${path} deve ser booleano`);
  return value;
};
const tuple2 = (value, path) => {
  const items = asArray(value, path);
  if (items.length !== 2) fail(`${path} deve ter duas linhas`);
  return Object.freeze([
    nonEmptyString(items[0], `${path}[0]`),
    nonEmptyString(items[1], `${path}[1]`),
  ]);
};
const stringList = (value, path) =>
  Object.freeze(
    asArray(value, path).map((item, index) => nonEmptyString(item, `${path}[${index}]`)),
  );
const storyList = (value, path) =>
  Object.freeze(
    asArray(value, path).map((item, index) => {
      const record = asRecord(item, `${path}[${index}]`);
      return Object.freeze({
        channel: nonEmptyString(record.channel, `${path}[${index}].channel`),
        title: nonEmptyString(record.title, `${path}[${index}].title`),
        summary: nonEmptyString(record.summary, `${path}[${index}].summary`),
        href:
          typeof record.href === 'string' && record.href.trim() !== '' ? record.href : undefined,
      });
    }),
  );
export const parseHomePageData = (value) => {
  const root = asRecord(value, 'raiz');
  const hero = asRecord(root.hero, 'hero');
  const dailyEdition = asRecord(root.dailyEdition, 'dailyEdition');
  const stateKind = nonEmptyString(hero.stateKind, 'hero.stateKind');
  const allowedStates = ['developing', 'confirmed', 'analysis', 'document', 'corrected'];
  if (!allowedStates.includes(stateKind)) fail('hero.stateKind não é reconhecido');
  const navigation = Object.freeze(
    asArray(root.navigation, 'navigation').map((item, index) => {
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
      stateKind: stateKind,
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
  };
  return Object.freeze(parsed);
};
