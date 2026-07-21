# Cadeia de revisões pós-publicação

| Revisão | Estado                 | Pacote                                               | SHA-256                                                            | Supersedes                                                              |
| ------: | ---------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
|      r1 | publicação original    | `fixtures/packager/golden/r1.zip`                    | `84263841a5ba6e1ba1294e234c18ac555f9fef869f0b105d1b98391e177d5d94` | —                                                                       |
|      r2 | correção factual       | `fixtures/post-publication/golden/r2-correction.zip` | `b7619ec333f54849749911393ffd87be4959a8d907569108b21ba99cde0fb41f` | r1 / `84263841a5ba6e1ba1294e234c18ac555f9fef869f0b105d1b98391e177d5d94` |
|      r3 | retirada com tombstone | `fixtures/post-publication/golden/r3-withdrawal.zip` | `f859d5529018049fab364ec525eefb5d66b56a77f14d73747fbb8a4c1546292e` | r2 / `b7619ec333f54849749911393ffd87be4959a8d907569108b21ba99cde0fb41f` |

## Evidências

- os três arquivos coexistem; nenhum pacote foi sobrescrito;
- r2 contém correção factual e mantém o corpo corrigido;
- r3 contém correção factual e retirada;
- o corpo original não aparece na publicação de r3;
- o tombstone preserva canonical, título, motivo, impacto e data original;
- os checksums internos e a cadeia `supersedes` foram validados pela CLI.
