# Dicionário de dados editorial

**Schema:** `1.0.0`

Visibilidades:

- `private`: nunca exportar;
- `candidate_public`: pode compor a publicação após sanitização;
- `public_after_merge`: só é público depois do merge.

## PAUTAS

| Campo                  | Tipo      | Obrigatório | Visibilidade | Descrição                                 |
| ---------------------- | --------- | ----------: | ------------ | ----------------------------------------- |
| `pauta_id`             | string    |         sim | `private`    | Identificador estável da pauta.           |
| `titulo_provisorio`    | string    |         sim | `private`    | Título interno inicial.                   |
| `origem`               | enum      |         sim | `private`    | Origem da pauta.                          |
| `url_origem`           | url       |         não | `private`    | URL inicial da origem.                    |
| `prioridade`           | enum      |         sim | `private`    | Prioridade editorial A–E.                 |
| `nivel_cobertura`      | integer   |         sim | `private`    | Nível de cobertura 0–5.                   |
| `destino_inicial`      | enum      |         sim | `private`    | Destino definido pela Mesa.               |
| `canal_provavel`       | reference |         não | `private`    | Canal inicial, ainda revisável.           |
| `quadro_provavel`      | reference |         não | `private`    | Quadro inicial, ainda revisável.          |
| `responsavel`          | reference |         sim | `private`    | Repórter principal.                       |
| `editor`               | reference |         sim | `private`    | Editor responsável.                       |
| `guardiao_editorial`   | reference |         não | `private`    | Guardião da história.                     |
| `status`               | enum      |         sim | `private`    | Estado operacional.                       |
| `prazo`                | datetime  |         não | `private`    | Prazo ou checkpoint.                      |
| `proximo_gatilho`      | string    |         não | `private`    | Informação necessária para nova decisão.  |
| `documento`            | url       |         não | `private`    | Google Docs da matéria.                   |
| `pasta_drive`          | url       |         não | `private`    | Pasta de pesquisa.                        |
| `criado_em`            | datetime  |         sim | `private`    | Criação.                                  |
| `atualizado_em`        | datetime  |         sim | `private`    | Última atualização.                       |
| `observacoes_privadas` | string    |         não | `private`    | Notas que nunca entram no pacote público. |

## ARTIGOS

| Campo                | Tipo      | Obrigatório | Visibilidade         | Descrição                                |
| -------------------- | --------- | ----------: | -------------------- | ---------------------------------------- |
| `artigo_id`          | string    |         sim | `private`            | Identificador interno estável.           |
| `pauta_id`           | reference |         sim | `private`            | Pauta de origem.                         |
| `edition_id`         | reference |         não | `private`            | Edição planejada.                        |
| `titulo`             | string    |         sim | `candidate_public`   | Título final.                            |
| `slug`               | slug      |         sim | `candidate_public`   | Slug definido antes da publicação.       |
| `linha_fina`         | string    |         sim | `candidate_public`   | Resumo editorial.                        |
| `descricao_seo`      | string    |         sim | `candidate_public`   | Descrição para busca e compartilhamento. |
| `canal`              | reference |         sim | `candidate_public`   | Canal editorial.                         |
| `quadro`             | reference |         não | `candidate_public`   | Quadro editorial.                        |
| `tipo`               | enum      |         sim | `candidate_public`   | Natureza do conteúdo.                    |
| `autor`              | reference |         sim | `candidate_public`   | Assinatura principal.                    |
| `editor`             | reference |         sim | `candidate_public`   | Editor responsável.                      |
| `prioridade`         | enum      |         sim | `private`            | Prioridade operacional.                  |
| `status`             | enum      |         sim | `private`            | Estado operacional.                      |
| `documento`          | url       |         sim | `private`            | Google Docs.                             |
| `pasta_drive`        | url       |         sim | `private`            | Pasta de trabalho.                       |
| `imagem_capa`        | url       |         não | `private`            | Original ou arquivo de trabalho.         |
| `texto_alt`          | string    |         não | `candidate_public`   | Texto alternativo.                       |
| `revisao_editorial`  | enum      |         sim | `private`            | Estado da revisão editorial.             |
| `revisao_factual`    | enum      |         sim | `private`            | Estado da revisão factual.               |
| `revisao_tecnica`    | enum      |         sim | `private`            | Estado da validação técnica.             |
| `data_planejada`     | datetime  |         não | `private`            | Data desejada.                           |
| `data_publicada`     | datetime  |         não | `public_after_merge` | Data pública.                            |
| `branch`             | string    |         não | `private`            | Branch.                                  |
| `pull_request`       | url       |         não | `private`            | Pull request.                            |
| `url_publicada`      | url       |         não | `public_after_merge` | URL final.                               |
| `revisao`            | integer   |         sim | `public_after_merge` | Revisão pública.                         |
| `ultima_atualizacao` | datetime  |         sim | `private`            | Última atualização operacional.          |

## EDICOES

| Campo              | Tipo     | Obrigatório | Visibilidade         | Descrição                  |
| ------------------ | -------- | ----------: | -------------------- | -------------------------- |
| `edition_id`       | string   |         sim | `candidate_public`   | Identificador diário.      |
| `edition_date`     | date     |         sim | `candidate_public`   | Data editorial.            |
| `status`           | enum     |         sim | `private`            | Ciclo da edição.           |
| `revision`         | integer  |         sim | `public_after_merge` | Revisão pública.           |
| `mapa_do_dia`      | url      |         sim | `private`            | Documento privado da Mesa. |
| `manifest_path`    | string   |         não | `private`            | Manifest gerado.           |
| `package_checksum` | string   |         não | `private`            | SHA-256.                   |
| `drive_file_id`    | string   |         não | `private`            | ZIP preservado.            |
| `branch`           | string   |         não | `private`            | Branch.                    |
| `pull_request`     | url      |         não | `private`            | PR.                        |
| `commit_sha`       | string   |         não | `private`            | Commit público.            |
| `deployment_url`   | url      |         não | `public_after_merge` | Página da edição.          |
| `opened_at`        | datetime |         não | `private`            | Abertura.                  |
| `sealed_at`        | datetime |         não | `public_after_merge` | Fechamento.                |
| `last_error`       | string   |         não | `private`            | Erro operacional resumido. |

## AUTORES

| Campo             | Tipo   | Obrigatório | Visibilidade       | Descrição             |
| ----------------- | ------ | ----------: | ------------------ | --------------------- |
| `author_id`       | string |         sim | `candidate_public` | ID estável.           |
| `nickname`        | string |         sim | `candidate_public` | Apelido público.      |
| `slug`            | slug   |         sim | `candidate_public` | Rota pública.         |
| `role`            | string |         sim | `candidate_public` | Cargo.                |
| `department`      | string |         sim | `candidate_public` | Departamento.         |
| `role_type`       | enum   |         sim | `candidate_public` | Editor ou jornalista. |
| `blog`            | string |         não | `candidate_public` | Blog ou coluna.       |
| `status`          | enum   |         sim | `candidate_public` | Situação.             |
| `profile_version` | string |         sim | `private`          | Versão do dossiê.     |
| `dossier_path`    | string |         sim | `private`          | Referência canônica.  |

## CANAIS

| Campo         | Tipo      | Obrigatório | Visibilidade       | Descrição                 |
| ------------- | --------- | ----------: | ------------------ | ------------------------- |
| `channel_id`  | string    |         sim | `candidate_public` | ID estável.               |
| `name`        | string    |         sim | `candidate_public` | Nome público.             |
| `slug`        | slug      |         sim | `candidate_public` | Rota.                     |
| `department`  | string    |         sim | `private`          | Departamento responsável. |
| `editor_id`   | reference |         sim | `candidate_public` | Editor.                   |
| `question`    | string    |         sim | `candidate_public` | Pergunta editorial.       |
| `function`    | string    |         sim | `candidate_public` | Função.                   |
| `periodicity` | string    |         sim | `candidate_public` | Periodicidade.            |
| `status`      | enum      |         sim | `candidate_public` | Situação.                 |
| `is_daily`    | boolean   |         sim | `candidate_public` | Canal diário.             |

## QUADROS

| Campo         | Tipo      | Obrigatório | Visibilidade       | Descrição                            |
| ------------- | --------- | ----------: | ------------------ | ------------------------------------ |
| `frame_id`    | string    |         sim | `candidate_public` | ID estável e qualificado pelo canal. |
| `channel_id`  | reference |         sim | `candidate_public` | Canal proprietário.                  |
| `name`        | string    |         sim | `candidate_public` | Nome.                                |
| `slug`        | slug      |         sim | `candidate_public` | Slug local.                          |
| `description` | string    |         sim | `candidate_public` | Função resumida.                     |
| `position`    | integer   |         sim | `private`          | Ordem padrão.                        |
| `required`    | boolean   |         sim | `private`          | Obrigatório em toda edição.          |
| `status`      | enum      |         sim | `candidate_public` | Situação.                            |

## TEMAS

| Campo          | Tipo    | Obrigatório | Visibilidade       | Descrição                |
| -------------- | ------- | ----------: | ------------------ | ------------------------ |
| `topic_id`     | string  |         sim | `candidate_public` | ID estável.              |
| `name`         | string  |         sim | `candidate_public` | Nome.                    |
| `slug`         | slug    |         sim | `candidate_public` | Rota.                    |
| `status`       | enum    |         sim | `candidate_public` | Situação.                |
| `is_sensitive` | boolean |         sim | `private`          | Exige revisão adicional. |

## FONTES

| Campo           | Tipo      | Obrigatório | Visibilidade       | Descrição                                      |
| --------------- | --------- | ----------: | ------------------ | ---------------------------------------------- |
| `source_id`     | string    |         sim | `private`          | ID estável.                                    |
| `pauta_id`      | reference |         não | `private`          | Pauta.                                         |
| `artigo_id`     | reference |         não | `private`          | Artigo.                                        |
| `type`          | enum      |         sim | `candidate_public` | Tipo.                                          |
| `title`         | string    |         sim | `candidate_public` | Título.                                        |
| `publisher`     | string    |         não | `candidate_public` | Publicador.                                    |
| `url`           | url       |         sim | `candidate_public` | URL pública quando aplicável.                  |
| `published_at`  | datetime  |         não | `candidate_public` | Data da fonte.                                 |
| `accessed_at`   | datetime  |         sim | `candidate_public` | Acesso.                                        |
| `confidential`  | boolean   |         sim | `private`          | Fonte protegida; nunca exportar identificação. |
| `notes_private` | string    |         não | `private`          | Notas de checagem.                             |

## PUBLICACOES

| Campo              | Tipo      | Obrigatório | Visibilidade         | Descrição         |
| ------------------ | --------- | ----------: | -------------------- | ----------------- |
| `publication_id`   | string    |         sim | `public_after_merge` | ID público.       |
| `artigo_id`        | reference |         sim | `private`            | Artigo de origem. |
| `edition_id`       | reference |         sim | `public_after_merge` | Edição.           |
| `revision`         | integer   |         sim | `public_after_merge` | Revisão.          |
| `public_state`     | enum      |         sim | `public_after_merge` | Estado público.   |
| `published_at`     | datetime  |         sim | `public_after_merge` | Publicação.       |
| `updated_at`       | datetime  |         não | `public_after_merge` | Atualização.      |
| `url`              | url       |         sim | `public_after_merge` | URL.              |
| `commit_sha`       | string    |         sim | `private`            | Commit.           |
| `package_checksum` | string    |         sim | `private`            | Pacote.           |

## CORRECOES

| Campo               | Tipo      | Obrigatório | Visibilidade         | Descrição                       |
| ------------------- | --------- | ----------: | -------------------- | ------------------------------- |
| `correction_id`     | string    |         sim | `public_after_merge` | ID.                             |
| `publication_id`    | reference |         sim | `public_after_merge` | Publicação.                     |
| `type`              | enum      |         sim | `public_after_merge` | Natureza.                       |
| `summary`           | string    |         sim | `public_after_merge` | Explicação pública.             |
| `impact`            | string    |         sim | `public_after_merge` | Impacto na leitura.             |
| `previous_revision` | integer   |         sim | `public_after_merge` | Revisão anterior.               |
| `new_revision`      | integer   |         sim | `public_after_merge` | Nova revisão.                   |
| `status`            | enum      |         sim | `private`            | Fluxo operacional.              |
| `requested_at`      | datetime  |         sim | `private`            | Solicitação.                    |
| `published_at`      | datetime  |         não | `public_after_merge` | Publicação da nota.             |
| `requested_by`      | string    |         não | `private`            | Solicitante interno ou externo. |

## AUTOMACOES

| Campo           | Tipo     | Obrigatório | Visibilidade | Descrição                 |
| --------------- | -------- | ----------: | ------------ | ------------------------- |
| `automation_id` | string   |         sim | `private`    | ID do workflow.           |
| `name`          | string   |         sim | `private`    | Nome.                     |
| `enabled`       | boolean  |         sim | `private`    | Ativa.                    |
| `mode`          | enum     |         sim | `private`    | MANUAL, DRY_RUN ou APPLY. |
| `last_run_id`   | string   |         não | `private`    | Última execução.          |
| `last_status`   | string   |         não | `private`    | Resultado.                |
| `last_run_at`   | datetime |         não | `private`    | Horário.                  |
| `next_action`   | string   |         não | `private`    | Ação necessária.          |

## CONFIGURACOES

| Campo         | Tipo    | Obrigatório | Visibilidade | Descrição                                             |
| ------------- | ------- | ----------: | ------------ | ----------------------------------------------------- |
| `key`         | string  |         sim | `private`    | Chave.                                                |
| `value`       | string  |         sim | `private`    | Valor não secreto.                                    |
| `type`        | enum    |         sim | `private`    | string, integer, boolean, enum.                       |
| `description` | string  |         sim | `private`    | Descrição.                                            |
| `secret`      | boolean |         sim | `private`    | Se verdadeiro, o valor real não pode ficar no Sheets. |

## ARTIGOS.comentarios_resolvidos

- **tipo:** boolean;
- **visibilidade:** privada;
- **obrigatório:** sim;
- **função:** confirmação humana de que todos os comentários editoriais relevantes do Google Docs foram revisados e resolvidos;
- **regra:** somente `TRUE` permite a leitura pelo provider Google;
- **motivo técnico:** a integração 0.5.1-dev usa os scopes mínimos de Docs e Sheets e não solicita acesso à Drive Comments API.
