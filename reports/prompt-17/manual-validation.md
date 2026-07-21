# Prompt 17 — Validação manual

## Executado

- inspeção visual da folha de contato;
- conferência de perfil, card, circle-safe e social;
- abertura dos JPEGs derivados;
- conferência dos MIME reais;
- inspeção do JSON público;
- pesquisa por EXIF/XMP/IPTC nos derivados;
- conferência de que `src/data/media/portraits.json` não associa a fixture a nenhum editor;
- conferência de que páginas sem retrato aprovado mantêm placeholder;
- conferência de que o empacotador não aceita diretórios de originais.

## Pendente no ambiente completo

- build Astro;
- inspeção das páginas reais em desktop e mobile;
- teste Playwright do `<picture>`;
- teste visual dos onze retratos aprovados;
- integração com masters reais do Drive;
- revisão coletiva da grade dos onze editores.

## Critério para ativar um retrato

Um retrato só pode substituir o placeholder após:

1. aprovação visual;
2. confirmação de direitos;
3. manifesto completo;
4. dry-run revisado;
5. inspeção dos quatro cortes;
6. apply;
7. associação do `media_id` ao editor;
8. build e revisão em desktop e mobile.
