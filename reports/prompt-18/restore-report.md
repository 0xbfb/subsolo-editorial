# Relatório de restauração — Prompt 18

- backup portátil criptografado criado: aprovado;
- bundle em texto claro removido após criptografia: aprovado;
- `.env` e credenciais no bundle: ausentes;
- checksum externo: aprovado;
- descriptografia AES-256-CBC/PBKDF2: aprovada;
- manifesto e seis componentes: aprovados;
- cabeçalho `PGDMP`: aprovado;
- quatro arquivos de volume extraídos em diretório limpo: aprovados;
- restore destrutivo em Docker real: não executado, Docker indisponível;
- credenciais: deliberadamente não restauradas.

A evidência estruturada está em `restore-report.json`.
