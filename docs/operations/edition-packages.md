# Pacotes imutáveis de edição

## Finalidade

O ZIP de edição é o artefato técnico de preservação e recuperação do Subsolo. Ele não é consultado pelo portal em tempo de execução e não substitui o conteúdo versionado no Git.

## Workspace de entrada

```text
workspace/
├── edition.json
├── edition.md
├── publications/
│   └── pub_.../
│       ├── publication.md
│       ├── sources.json
│       ├── corrections.json
│       ├── media.json
│       └── provenance.public.json
└── media/
    └── derived/
```

`edition.json` controla `edition_id`, `run_id`, revisão, datas, `supersedes`, ordem e caminho das publicações. O empacotador rejeita symlinks, originais, segredos, travessia de diretórios, arquivos inesperados e divergência entre o manifesto da edição e o front matter.

## Dry-run

```bash
node cli/subsolo.mjs package \
  --workspace fixtures/packager/edition-r1 \
  --destination .tmp/packages \
  --dry-run
```

O dry-run valida e constrói o ZIP em memória, calcula o SHA-256 e informa todas as entradas, mas não grava arquivo.

## Apply

```bash
node cli/subsolo.mjs package \
  --workspace fixtures/packager/edition-r1 \
  --destination .tmp/packages \
  --apply
```

Nome padrão:

```text
subsolo-edicao-20260720T150000-0300-r1.zip
```

O apply grava primeiro um arquivo temporário e realiza rename atômico. Um destino existente nunca é sobrescrito. Se os bytes forem iguais, a execução falha como duplicidade idempotente; se forem diferentes, falha como conflito de destino.

## Revisões

A revisão 1 exige `supersedes: null`. Revisões posteriores exigem o ZIP imediatamente anterior:

```bash
node cli/subsolo.mjs package \
  --workspace fixtures/packager/edition-r2 \
  --destination .tmp/packages \
  --previous-package .tmp/packages/subsolo-edicao-20260720T150000-0300-r1.zip \
  --apply
```

São verificados:

- mesma edição;
- revisão anterior igual a `N - 1`;
- `run_id` anterior igual a `supersedes`;
- pacote anterior íntegro.

## Conteúdo do pacote

```text
manifest.json
edition.md
publication-run.json
checksums.sha256
reports/validation.json
reports/provenance.public.json
publications/.../publication.md
publications/.../sources.json
publications/.../corrections.json
publications/.../media.json
publications/.../provenance.public.json
media/derived/...                   # quando existir
```

`checksums.sha256` cobre todas as outras entradas. O próprio arquivo de checksums fica fora da lista para evitar autorreferência.

## Determinismo

O ZIP usa:

- entradas em ordem lexicográfica;
- método STORE, sem compressão dependente de implementação;
- timestamp DOS derivado de `generated_at`;
- JSON estável;
- nenhuma data obtida do relógio da máquina dentro do artefato.

A mesma entrada produz os mesmos bytes, independentemente do caminho de destino.

## Validação

```bash
node cli/subsolo.mjs validate-package --package pacote.zip
```

A validação confere:

- formato ZIP suportado;
- CRC32 de cada entrada;
- caminhos seguros;
- manifesto;
- checksums SHA-256;
- estrutura mínima.

## Restauração

Dry-run:

```bash
node cli/subsolo.mjs restore \
  --package pacote.zip \
  --destination .tmp/restored \
  --dry-run
```

Apply:

```bash
node cli/subsolo.mjs restore \
  --package pacote.zip \
  --destination .tmp/restored \
  --apply
```

O restore valida integralmente antes de escrever, usa staging e só substitui destino existente com `--overwrite` explícito. A restauração não reintroduz o `edition.json` privado; ela recupera exatamente o pacote público preservado.

## Limites da versão 0.6.0-dev

- nenhum upload ao Google Drive;
- nenhuma criação de branch ou pull request;
- ZIPs usam apenas o método STORE;
- assinatura criptográfica fica para evolução posterior;
- o pacote é público e sanitizado; originais permanecem fora dele.
