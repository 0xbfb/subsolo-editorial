# Runbook de incidentes

## Classificação

### P1 — perda ou corrupção provável

Exemplos: checksum divergente, pacote técnico ausente, restore falho, publicação incompatível com o repositório.

Ações:

1. suspender novas automações;
2. preservar logs e pacotes;
3. enviar alerta crítico;
4. executar reconciliação em dry-run;
5. validar o backup mais recente;
6. não apagar versões conflitantes.

### P2 — publicação ou automação indisponível

Exemplos: n8n parado, Drive indisponível, GitHub falhando, build quebrado.

Ações:

1. confirmar se o portal público permanece acessível;
2. classificar o erro como retryable ou definitivo;
3. evitar reexecução paralela;
4. usar dead letter e retry manual quando aplicável.

### P3 — serviço auxiliar degradado

Exemplos: FreshRSS, SearXNG, Kuma ou ntfy indisponível.

Ações:

1. registrar a falha;
2. continuar somente quando a atividade não depender do serviço;
3. não tratar ausência de alerta como ausência de incidente.

## Evidência mínima

- timestamp UTC;
- código;
- componente;
- run ID;
- última etapa concluída;
- retryable;
- artefatos envolvidos;
- ação humana tomada.

Nunca copie corpo editorial, tokens ou credenciais para o relatório.
