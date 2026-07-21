# Catálogo de erros do contrato público

Os erros possuem `code`, `path`, `message` e `action`.

Famílias principais:

- `SUBSOLO_SCHEMA_*`: versão e migração;
- `SUBSOLO_PUBLICATION_*`: publicação;
- `SUBSOLO_EDITION_*`: edição;
- `SUBSOLO_SOURCE_*`: fonte;
- `SUBSOLO_CORRECTION_*`: correção;
- `SUBSOLO_MEDIA_*`: mídia;
- `SUBSOLO_STORY_*`: história;
- `SUBSOLO_AUTHOR_*`: autor;
- `SUBSOLO_CHANNEL_*`: canal;
- `SUBSOLO_TOPIC_*`: tema;
- `SUBSOLO_MARKDOWN_*`: corpo e links;
- `SUBSOLO_REFERENCE_*`: integridade referencial.

Mensagens não devem incluir tokens, notas privadas nem corpo editorial completo.

## Pacotes de edição (`SUBSOLO_PACKAGE_*`)

- `SUBSOLO_PACKAGE_REVISION_INVALID`: revisão menor que 1 ou não inteira;
- `SUBSOLO_PACKAGE_PREVIOUS_REQUIRED`: revisão posterior sem ZIP anterior;
- `SUBSOLO_PACKAGE_SUPERSEDES_INVALID`: cadeia de revisão divergente;
- `SUBSOLO_PACKAGE_DUPLICATE`: ZIP idêntico já preservado;
- `SUBSOLO_PACKAGE_DESTINATION_EXISTS`: destino ocupado por bytes diferentes;
- `SUBSOLO_PACKAGE_CHECKSUM_INVALID`: SHA-256 divergente;
- `SUBSOLO_PACKAGE_CRC_INVALID`: entrada ZIP corrompida;
- `SUBSOLO_PACKAGE_PATH_INVALID`: caminho absoluto, ambíguo ou com travessia;
- `SUBSOLO_PACKAGE_SYMLINK_REJECTED`: symlink no workspace;
- `SUBSOLO_PACKAGE_PRIVATE_FILE`: original, segredo ou dependência no workspace;
- `SUBSOLO_PACKAGE_PUBLICATION_MISMATCH`: manifesto da edição e front matter divergem;
- `SUBSOLO_RESTORE_DESTINATION_EXISTS`: destino de restauração exige escolha explícita.
