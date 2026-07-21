# Validação manual recomendada

Estas verificações dependem do build Astro e de um ambiente navegável:

1. acessar a URL antiga da publicação de plataforma e confirmar resposta 308;
2. confirmar canonical no destino novo;
3. abrir a publicação retirada e verificar que apenas o tombstone é renderizado;
4. inspecionar o HTML e confirmar ausência do corpo ocultado;
5. buscar o título retirado e confirmar resumo de retirada;
6. abrir o arquivo diário e confirmar que o registro permanece;
7. abrir o feed de correções em um leitor RSS;
8. criar um PR de correção e confirmar que o merge continua manual;
9. verificar no Google Drive que r1, r2 e r3 coexistem;
10. baixar r3 e executar `validate-package` e `restore`.

O ambiente atual não permitiu build Astro, browser E2E, Google Drive, GitHub, n8n ou PostgreSQL reais.
