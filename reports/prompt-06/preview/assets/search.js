(() => {
  const root = document.querySelector('[data-search-root]');
  if (!root) return;
  const form = root.querySelector('[data-search-form]');
  const status = root.querySelector('[data-search-status]');
  const output = root.querySelector('[data-search-results]');
  const indexHref = root.dataset.indexHref;
  const pagefindHref = root.dataset.pagefindHref;
  if (
    !(form instanceof HTMLFormElement) ||
    !(status instanceof HTMLElement) ||
    !(output instanceof HTMLOListElement) ||
    !indexHref ||
    !pagefindHref
  )
    return;

  let archiveIndex = null;
  let pagefind = null;

  const appendResult = (entry) => {
    const item = document.createElement('li');
    const article = document.createElement('article');
    const kicker = document.createElement('div');
    const heading = document.createElement('h2');
    const link = document.createElement('a');
    const summary = document.createElement('p');
    kicker.className = 'kicker';
    kicker.textContent = `${entry.channel} · ${entry.type} · ${entry.date}`;
    link.href = entry.href;
    link.textContent = entry.title;
    summary.textContent = entry.summary;
    heading.append(link);
    article.append(kicker, heading, summary);
    item.append(article);
    output.append(item);
  };

  const render = (entries, query) => {
    output.replaceChildren();
    for (const entry of entries) appendResult(entry);
    if (entries.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'Nenhum registro corresponde aos filtros atuais.';
      output.append(empty);
    }
    status.textContent = `${entries.length} resultado${entries.length === 1 ? '' : 's'}${query ? ` para “${query}”` : ''}.`;
  };

  const selected = () => Object.fromEntries(new FormData(form).entries());
  const passes = (entry, filters) =>
    (!filters.channel || entry.channel === filters.channel) &&
    (!filters.topic || entry.topics.includes(filters.topic)) &&
    (!filters.author || entry.authors.includes(filters.author)) &&
    (!filters.type || entry.type === filters.type) &&
    (!filters.state || entry.state === filters.state);

  const search = async () => {
    if (!archiveIndex) return;
    const filters = selected();
    const query = String(filters.q || '').trim();
    let allowed = archiveIndex.entries.filter((entry) => passes(entry, filters));
    if (query && pagefind) {
      const filterValues = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => key !== 'q' && value),
      );
      const result = await pagefind.search(query, { filters: filterValues });
      const details = await Promise.all(result.results.map((item) => item.data()));
      const hrefs = new Set(details.map((item) => new URL(item.url, location.origin).pathname));
      allowed = allowed.filter((entry) => hrefs.has(new URL(entry.href, location.origin).pathname));
    } else if (query) {
      const needle = query.toLocaleLowerCase('pt-BR');
      allowed = allowed.filter((entry) =>
        `${entry.title} ${entry.summary}`.toLocaleLowerCase('pt-BR').includes(needle),
      );
    }
    render(allowed, query);
  };

  const load = async () => {
    const response = await fetch(indexHref, { credentials: 'same-origin' });
    if (!response.ok) throw new Error('archive-index indisponível');
    archiveIndex = await response.json();
    try {
      pagefind = await import(pagefindHref);
    } catch (_) {
      pagefind = null;
    }
    status.textContent = `${archiveIndex.total} registros disponíveis. Digite um termo ou use os filtros.`;
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    search().catch(() => {
      status.textContent =
        'A busca falhou. O arquivo continua disponível pelas rotas de navegação.';
    });
  });
  form.addEventListener('change', () => {
    search().catch(() => undefined);
  });
  form.addEventListener('reset', () => {
    setTimeout(() => {
      search().catch(() => undefined);
    });
  });
  load()
    .then(search)
    .catch(() => {
      status.textContent =
        'O índice estático não pôde ser carregado. Use o arquivo por data e taxonomia.';
    });
})();
