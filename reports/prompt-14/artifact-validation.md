# Validação do artefato cumulativo

O release de desenvolvimento exclui:

- `.git`;
- `node_modules`;
- `.tmp`;
- caches;
- credenciais;
- arquivos `.env` reais;
- bytecode Python.

A integridade do ZIP, a ausência de symlinks e a equivalência da árvore extraída são verificadas depois da compactação. O checksum SHA-256 é distribuído ao lado do artefato.
