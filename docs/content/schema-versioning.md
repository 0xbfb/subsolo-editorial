# Versionamento e migração de schema

O contrato usa versionamento semântico.

- patch: esclarecimento compatível;
- minor: campo opcional ou capacidade compatível;
- major: alteração incompatível.

O importador:

- aceita a versão atual;
- rejeita major desconhecida;
- não modifica documentos silenciosamente;
- exige função de migração explicitamente registrada para versão antiga;
- detecta ciclos no registro de migrações.
