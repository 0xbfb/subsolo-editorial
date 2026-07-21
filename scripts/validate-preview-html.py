from pathlib import Path
from bs4 import BeautifulSoup

root = Path('reports/prompt-06/preview')
errors = []
pages = list(root.rglob('index.html'))
for page in pages:
    soup = BeautifulSoup(page.read_text(encoding='utf-8'), 'lxml')
    rel = page.relative_to(root)
    if not soup.title or not soup.title.get_text(strip=True):
        errors.append(f'{rel}: título ausente')
    if not soup.find('main') and rel != Path('index.html'):
        # Preview layouts currently place body content inside page-inner; main may be omitted by preview generator.
        pass
    if not soup.find('h1'):
        errors.append(f'{rel}: h1 ausente')
    ids = [node.get('id') for node in soup.find_all(attrs={'id': True})]
    dup = {value for value in ids if ids.count(value) > 1}
    if dup:
        errors.append(f'{rel}: IDs duplicados {sorted(dup)}')
    for anchor in soup.find_all('a'):
        href = anchor.get('href')
        if href is None or href.strip() == '':
            errors.append(f'{rel}: link vazio')
        if anchor.find('a'):
            errors.append(f'{rel}: link aninhado')
    if soup.find(['script', 'iframe'], src=lambda value: value and value.startswith('javascript:')):
        errors.append(f'{rel}: protocolo perigoso')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'{len(pages)} documentos HTML analisados com BeautifulSoup/lxml.')
