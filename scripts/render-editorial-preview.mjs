import { readFile, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'reports/prompt-06/preview');
const data = JSON.parse(
  await readFile(join(root, 'src/data/fixtures/editorial-site.json'), 'utf8'),
);
const authors = JSON.parse(
  await readFile(join(root, 'src/data/editorial/catalogs/authors.json'), 'utf8'),
);
const channels = JSON.parse(
  await readFile(join(root, 'src/data/editorial/catalogs/channels.json'), 'utf8'),
);
const topics = JSON.parse(
  await readFile(join(root, 'src/data/editorial/catalogs/topics.json'), 'utf8'),
);
const authorMap = Object.fromEntries(authors.map((item) => [item.slug, item]));
const channelMap = Object.fromEntries(channels.map((item) => [item.slug, item]));
const pubMap = Object.fromEntries(data.publications.map((item) => [item.id, item]));
const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const pathFor = (publication) => `/${publication.date.replaceAll('-', '/')}/${publication.slug}/`;
const relativeAsset = (route, asset) => {
  const depth = route === '/' ? 0 : route.split('/').filter(Boolean).length;
  return `${'../'.repeat(depth)}${asset}`;
};
const nav = [
  ['Início', '/'],
  ['Agora', '/agora/'],
  ['Canais', '/canais/'],
  ['Tecnologia', '/temas/tecnologia/'],
  ['Arquivo', '/arquivo/'],
  ['Busca', '/busca/'],
  ['A Redação', '/a-redacao/'],
];
const layout = (route, title, description, body) =>
  `<!doctype html><html lang="pt-BR" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(description)}"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; img-src 'self'; manifest-src 'self'; media-src 'self'; object-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; worker-src 'self' blob:; upgrade-insecure-requests"><title>${esc(title)} · Subsolo</title><link rel="stylesheet" href="${relativeAsset(route, 'assets/tokens.css')}"><link rel="stylesheet" href="${relativeAsset(route, 'assets/jornal-concreto.css')}"><script src="${relativeAsset(route, 'assets/theme.js')}"></script></head><body><div class="sheet"><a class="skip-link" href="#conteudo">Pular para o conteúdo</a><header class="masthead"><div class="mast-meta">${data.site.dateLabel.join('<br>')}</div><a class="logo" href="${relativeAsset(route, 'index.html')}">SUBSOLO</a><div class="mast-actions">O ruído passa.<br>O que importa fica.<br><button aria-pressed="false" class="theme-toggle" data-theme-toggle>Inverter papel</button></div></header><nav class="primary-nav" aria-label="Navegação principal">${nav.map(([label, href]) => `<a href="${href}"${(route.startsWith(href) && href !== '/') || route === href ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('')}</nav><main class="page-inner" id="conteudo">${body}</main><footer class="footer"><div class="footer-links"><a href="/a-redacao/">A Redação</a><a href="/canais/">Canais</a><a href="/arquivo/">Arquivo</a><a href="/busca/">Busca</a></div>SUBSOLO EDITORIAL · O RUÍDO PASSA. O QUE IMPORTA FICA.</footer></div></body></html>`;
const crumbs = (...labels) =>
  `<nav class="breadcrumbs">${labels.map((label) => `<span>${esc(label)}</span>`).join('')}</nav>`;
const intro = (eyebrow, title, summary) =>
  `<header class="page-intro"><div class="kicker">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p class="lead">${esc(summary)}</p></header>`;
const status = (item) => `<span class="status ${esc(item.stateKind)}">${esc(item.state)}</span>`;
const card = (publication, feature = false) =>
  `<article class="article-card${feature ? ' article-card--feature' : ''}"><div class="kicker">${esc(channelMap[publication.channel]?.name ?? publication.channel)} · ${esc(publication.type)}</div><h2><a href="${pathFor(publication)}">${esc(publication.title)}</a></h2><p>${esc(publication.subtitle)}</p><div class="article-meta-row">${status(publication)}<span class="meta">${esc(publication.readingTime)}</span></div></article>`;
const block = (item) =>
  `<aside class="editorial-block editorial-block--${esc(item.kind)}"><div class="editorial-block__label">${esc(item.label)}</div><p>${esc(item.text)}</p></aside>`;
const article = (publication) =>
  layout(
    pathFor(publication),
    publication.title,
    publication.subtitle,
    `${crumbs('Início', channelMap[publication.channel]?.name ?? publication.channel, publication.title)}<header class="article-header"><div class="kicker">${esc(channelMap[publication.channel]?.name ?? publication.channel)} · ${esc(publication.type)}</div><h1>${esc(publication.title)}</h1><p class="article-deck">${esc(publication.subtitle)}</p><div class="article-meta-row">${status(publication)}<span class="meta">Por ${publication.authors.map((slug) => esc(authorMap[slug]?.nickname ?? slug)).join(', ')}</span></div></header><div class="article-layout"><nav class="article-toc"><div class="kicker">Nesta publicação</div><ol>${publication.toc.map(([id, label]) => `<li><a href="#${esc(id)}">${esc(label)}</a></li>`).join('')}</ol></nav><div class="article-copy">${publication.sections.map((section) => `<section class="article-section" id="${esc(section.id)}"><h2>${esc(section.heading)}</h2>${section.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}${section.blocks.map(block).join('')}</section>`).join('')}</div></div>`,
  );
const pages = new Map();
pages.set(
  '/',
  layout(
    '/',
    'Início',
    data.site.description,
    `${crumbs('Início')}<section class="hero-grid"><article><div class="kicker">São Paulo Sob o Capô · Em desenvolvimento</div><h1><a class="hero-headline" href="${pathFor(data.publications[1])}">${esc(data.publications[1].title)}</a></h1><p class="lead">${esc(data.publications[1].subtitle)}</p></article><aside class="side-column">${data.publications
      .slice(2)
      .map(
        (p) =>
          `<article><div class="kicker">${esc(channelMap[p.channel].name)}</div><h2><a href="${pathFor(p)}">${esc(p.title)}</a></h2><p>${esc(p.subtitle)}</p></article>`,
      )
      .join(
        '',
      )}</aside></section><div class="section-rule"><span>Publicações</span><span>${data.publications.length}</span></div>${data.publications.map((p, i) => card(p, i === 0)).join('')}`,
  ),
);
pages.set(
  '/agora/',
  layout(
    '/agora/',
    'Agora',
    'Estado editorial atual.',
    `${crumbs('Início', 'Agora')}${intro('Estado editorial', 'O que merece atenção agora', 'Prioridades, publicações recentes e histórias que continuam abertas.')}${data.publications.map((p, i) => card(p, i === 1)).join('')}`,
  ),
);
pages.set(
  '/edicoes/',
  layout(
    '/edicoes/',
    'Edições',
    'Edições diárias.',
    `${crumbs('Início', 'Edições')}${intro('Arquivo diário', 'Edições', 'Cada edição preserva a hierarquia de um dia.')}<h2><a href="/edicoes/2026/07/20/">${esc(data.edition.label)}</a></h2>`,
  ),
);
pages.set(
  '/edicoes/2026/07/20/',
  layout(
    '/edicoes/2026/07/20/',
    `Edição de ${data.edition.label}`,
    data.edition.summary,
    `${crumbs('Início', 'Edições', data.edition.label)}${intro(`Edição diária · revisão ${data.edition.revision}`, data.edition.title, data.edition.summary)}${data.edition.publicationIds.map((id, i) => card(pubMap[id], i === 0)).join('')}`,
  ),
);
for (const publication of data.publications) pages.set(pathFor(publication), article(publication));
pages.set(
  '/canais/',
  layout(
    '/canais/',
    'Canais',
    'Canais editoriais.',
    `${crumbs('Início', 'Canais')}${intro('Produtos editoriais', 'Canais', 'Nove perguntas editoriais distintas.')}<h2 class="visually-hidden">Diretório de canais</h2><section class="channel-directory">${channels.map((c, i) => `<article><div class="number">${String(i + 1).padStart(2, '0')}</div><h3><a href="/canais/${c.slug}/">${esc(c.name)}</a></h3><p>${esc(c.function)}</p></article>`).join('')}</section>`,
  ),
);
for (const channel of channels) {
  const pubs = data.publications.filter((p) => p.channel === channel.slug);
  pages.set(
    `/canais/${channel.slug}/`,
    layout(
      `/canais/${channel.slug}/`,
      channel.name,
      channel.function,
      `${crumbs('Início', 'Canais', channel.name)}${intro(channel.periodicity, channel.name, channel.function)}${pubs.length ? pubs.map(card).join('') : '<section class="empty-state"><h2>Sem publicação nesta edição</h2><p>O canal não é preenchido artificialmente.</p></section>'}`,
    ),
  );
}
const topicSlugs = new Set([
  ...topics.map((t) => t.slug),
  ...data.publications.flatMap((p) => p.topics),
  'tecnologia',
]);
for (const slug of topicSlugs) {
  const topic = topics.find((t) => t.slug === slug);
  const name = topic?.name ?? slug.replaceAll('-', ' ').replace(/^./, (c) => c.toUpperCase());
  const pubs = data.publications.filter(
    (p) => p.topics.includes(slug) || (slug === 'tecnologia' && p.section === 'tecnologia'),
  );
  pages.set(
    `/temas/${slug}/`,
    layout(
      `/temas/${slug}/`,
      name,
      `Publicações sobre ${name}.`,
      `${crumbs('Início', name)}${intro('Linha de interesse', name, `Arquivo editorial relacionado a ${name.toLowerCase()}.`)}${pubs.length ? pubs.map(card).join('') : '<section class="empty-state"><h2>Arquivo em formação</h2></section>'}`,
    ),
  );
}
pages.set(
  '/redacao/',
  layout(
    '/redacao/',
    'Redação',
    'Diretório da redação.',
    `${crumbs('Início', 'A Redação', 'Diretório')}${intro('Corpo editorial', 'Redação', 'Editores, jornalistas e especialidades do Subsolo.')}<h2 class="visually-hidden">Diretório editorial</h2><section class="author-directory">${authors.map((a) => `<article class="directory-card"><div class="portrait-placeholder">${esc(a.nickname[0])}</div><div><div class="kicker">${esc(a.department)}</div><h3><a href="/redacao/${a.slug}/">${esc(a.nickname)}</a></h3><p>${esc(a.role)}</p></div></article>`).join('')}</section>`,
  ),
);
for (const author of authors) {
  const pubs = data.publications.filter(
    (p) => p.authors.includes(author.slug) || p.editor === author.slug,
  );
  pages.set(
    `/redacao/${author.slug}/`,
    layout(
      `/redacao/${author.slug}/`,
      author.nickname,
      author.role,
      `${crumbs('Início', 'A Redação', author.nickname)}${intro(author.department, author.nickname, author.role)}${pubs.length ? pubs.map(card).join('') : '<section class="empty-state"><h2>Sem assinatura nesta edição</h2></section>'}`,
    ),
  );
}
for (const story of data.stories)
  pages.set(
    `/historias/${story.slug}/`,
    layout(
      `/historias/${story.slug}/`,
      story.title,
      story.summary,
      `${crumbs('Início', 'Arquivo', story.title)}${intro(`História acompanhada · ${story.status}`, story.title, story.summary)}<h2>Cronologia</h2><ol class="timeline">${story.timeline.map((p) => `<li><div class="timeline__date">${esc(p.date)}</div><div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div></li>`).join('')}</ol>${story.publicationIds.map((id) => card(pubMap[id])).join('')}`,
    ),
  );
for (const doc of data.documents)
  pages.set(
    `/documentos/${doc.slug}/`,
    layout(
      `/documentos/${doc.slug}/`,
      doc.title,
      doc.summary,
      `${crumbs('Início', 'Arquivo', doc.title)}${intro(doc.type, doc.title, doc.summary)}${doc.excerpts.map((e) => `<figure class="document-excerpt"><blockquote>${esc(e.text)}</blockquote><figcaption>${esc(e.page)} · ${esc(e.comment)}</figcaption></figure>`).join('')}`,
    ),
  );
pages.set(
  '/arquivo/',
  layout(
    '/arquivo/',
    'Arquivo',
    'Arquivo editorial.',
    `${crumbs('Início', 'Arquivo')}${intro('Arquivo vivo', 'O que importa fica', 'Navegue por edição, canal, tema, autoria e histórias.')}${data.publications.map(card).join('')}`,
  ),
);
pages.set(
  '/a-redacao/',
  layout(
    '/a-redacao/',
    'A Redação',
    'Manifesto e corpo editorial.',
    `${crumbs('Início', 'A Redação')}${intro('Institucional', 'A Redação', 'Uma redação organizada para acompanhar sistemas, não apenas incidentes.')}<section class="manifesto-copy"><h2>Manifesto</h2><p>O Subsolo existe para reduzir ruído, preservar contexto e acompanhar o que acontece depois da manchete.</p></section>`,
  ),
);
pages.set(
  '/privacidade/',
  layout(
    '/privacidade/',
    'Privacidade',
    'Política inicial de privacidade.',
    `${crumbs('Início', 'Privacidade')}${intro('Política inicial', 'Leitura sem vigilância editorial', 'O portal não instala analytics, não cria perfil de leitor e não exige conta para acessar o arquivo.')}<section class="manifesto-copy"><h2>Dados tratados</h2><p>A preferência de tema permanece no navegador. A busca usa um índice estático no mesmo domínio.</p><h2>Serviços privados</h2><p>Os serviços editoriais locais não recebem eventos de leitura.</p></section>`,
  ),
);
pages.set(
  '/busca/',
  layout(
    '/busca/',
    'Busca',
    'Busca em construção.',
    `${crumbs('Início', 'Busca')}${intro('Busca', 'O índice ainda está em construção', 'A busca será ativada com Pagefind. O arquivo navegável já está disponível.')}<section class="empty-state empty-state--strong"><h2>Não vamos fingir que um campo sem índice é uma busca.</h2><p><a class="button-link" href="/arquivo/">Abrir o arquivo</a></p></section>`,
  ),
);
pages.set(
  '/404/',
  layout(
    '/404/',
    'Página não encontrada',
    'Página não encontrada.',
    intro(
      'Erro 404',
      'Este túnel termina em concreto',
      'A página solicitada não existe no arquivo.',
    ),
  ),
);
await rm(out, { recursive: true, force: true });
await mkdir(join(out, 'assets'), { recursive: true });
await copyFile(join(root, 'src/styles/tokens.css'), join(out, 'assets/tokens.css'));
await copyFile(
  join(root, 'src/styles/jornal-concreto.css'),
  join(out, 'assets/jornal-concreto.css'),
);
await copyFile(join(root, 'public/assets/theme.js'), join(out, 'assets/theme.js'));
await copyFile(join(root, 'public/assets/search.js'), join(out, 'assets/search.js'));
for (const [route, html] of pages) {
  const file = route === '/' ? join(out, 'index.html') : join(out, route.slice(1), 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}
await writeFile(
  join(out, 'route-manifest.json'),
  JSON.stringify([...pages.keys()].sort(), null, 2) + '\n',
);
console.log(`Preview editorial gerado: ${pages.size} rotas em ${out}`);
