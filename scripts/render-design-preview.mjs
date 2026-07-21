import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'reports/prompt-05/preview');
const fixture = JSON.parse(await readFile(resolve(root, 'src/data/fixtures/jornal-concreto-home.json'), 'utf8'));
const channels = JSON.parse(await readFile(resolve(root, 'src/data/editorial/catalogs/channels.json'), 'utf8'));

const escape = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const stories = (items, compact = false) => items.map((item) => `
  <article${compact ? '' : ' class="news-card"'}>
    <div class="kicker">${escape(item.channel)}</div>
    <h3><span class="story-title">${escape(item.title)}</span></h3>
    <p>${escape(item.summary)}</p>
  </article>`).join('');

const channelCards = channels.map((channel, index) => `
  <article>
    <div class="number">${String(index + 1).padStart(2, '0')}</div>
    <h3><span class="channel-card__title">${escape(channel.name)}</span></h3>
    <p>${escape(channel.function)}</p>
  </article>`).join('');

const nav = fixture.navigation.map((item) => item.available
  ? `<a${item.current ? ' aria-current="page"' : ''} href="${escape(item.href)}">${escape(item.label)}</a>`
  : `<span aria-disabled="true">${escape(item.label)}</span>`).join('');

const html = `<!doctype html>
<html data-theme="light" lang="pt-BR" class="js">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${escape(fixture.description)}"><title>${escape(fixture.pageTitle)} · Subsolo</title>
<link rel="stylesheet" href="assets/jornal-concreto.css">
<script>try{const t=localStorage.getItem('subsolo-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(_){}</script>
</head>
<body><div class="sheet"><a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
<header class="masthead"><div class="mast-meta">${escape(fixture.dateLabel[0])}<br>${escape(fixture.dateLabel[1])}</div><a aria-label="Subsolo — página inicial" class="logo" href="/">SUBSOLO</a><div class="mast-actions">O ruído passa.<br>O que importa fica.<br><button aria-pressed="false" class="theme-toggle" data-theme-toggle type="button">Inverter papel</button></div></header>
<nav aria-label="Navegação principal" class="primary-nav">${nav}</nav>
<div class="page-inner"><main id="conteudo"><nav aria-label="Navegação estrutural" class="breadcrumbs"><span>Início</span></nav>
<section class="hero-grid" aria-labelledby="manchete-principal"><article><div class="kicker">${escape(fixture.hero.channel)} · ${escape(fixture.hero.state)}</div><h1 id="manchete-principal"><span class="hero-headline--static">${escape(fixture.hero.title)}</span></h1><p class="lead dropcap">${escape(fixture.hero.summary)}</p><div class="article-meta-row"><span class="status ${escape(fixture.hero.stateKind)}">${escape(fixture.hero.state)}</span><span class="meta">${escape(fixture.hero.time)} · ${escape(fixture.hero.readingTime)} · por ${escape(fixture.hero.author)}</span></div></article><aside class="side-column" aria-label="Outros destaques">${stories(fixture.sideStories, true)}</aside></section>
<div class="section-rule"><span>Transmissões recentes</span><span>${escape(fixture.closingLabel)}</span></div><section class="news-grid" aria-label="Transmissões recentes">${stories(fixture.transmissions)}</section>
<section class="bdd-banner" aria-labelledby="bdd-heading"><div><div class="kicker">${escape(fixture.dailyEdition.eyebrow)}</div><div class="bdd-title" id="bdd-heading">${escape(fixture.dailyEdition.title[0])}<br>${escape(fixture.dailyEdition.title[1])}</div><p>${escape(fixture.dailyEdition.summary)}</p></div><div><ol class="bdd-list">${fixture.dailyEdition.items.map((item,index)=>`<li><span${index===fixture.dailyEdition.items.length-1?' class="future-link"':''}>${escape(item)}</span></li>`).join('')}</ol></div></section>
<div class="section-rule"><span>Canais do Subsolo</span><span>Nove frentes editoriais</span></div><section class="channel-directory" aria-label="Canais do Subsolo">${channelCards}</section>
</main></div><footer class="footer"><div class="footer-links"><span>A Redação</span><span>Canais</span><span>Arquivo</span><span>Busca</span><span>Documento de origem</span></div>SUBSOLO EDITORIAL · O RUÍDO PASSA. O QUE IMPORTA FICA.</footer></div>
<script src="assets/theme.js"></script></body></html>`;

await mkdir(resolve(output, 'assets'), { recursive: true });
await writeFile(resolve(output, 'index.html'), html);
await cp(resolve(root, 'src/styles/tokens.css'), resolve(output, 'assets/tokens.css'));
let css = await readFile(resolve(root, 'src/styles/jornal-concreto.css'), 'utf8');
css = css.replace("@import './tokens.css';", "@import './tokens.css';");
await writeFile(resolve(output, 'assets/jornal-concreto.css'), css);
await writeFile(resolve(output, 'assets/theme.js'), `(()=>{const r=document.documentElement,b=[...document.querySelectorAll('[data-theme-toggle]')],s=()=>{const d=r.dataset.theme==='dark';b.forEach(x=>{x.setAttribute('aria-pressed',String(d));x.textContent=d?'Papel claro':'Inverter papel'})};s();b.forEach(x=>x.addEventListener('click',()=>{r.dataset.theme=r.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('subsolo-theme',r.dataset.theme)}catch(_){}s()}))})();`);
console.log(output);
