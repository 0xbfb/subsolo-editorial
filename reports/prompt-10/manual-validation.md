# Validação manual — Prompt 10

## Executado

1. geração r1;
2. validação do ZIP;
3. geração r2 usando r1 como anterior;
4. restauração de r1 em diretório limpo;
5. verificação de todas as linhas de `checksums.sha256`;
6. leitura por Info-ZIP e Python `zipfile`;
7. comparação byte a byte de ZIPs gerados em destinos diferentes;
8. inspeção da lista de entradas;
9. tentativa de reempacotar no mesmo destino;
10. tentativa de restauração de ZIP corrompido.

## Confirmado

- nenhum ZIP anterior é sobrescrito;
- r2 referencia exatamente o `run_id` de r1;
- o pacote não contém `edition.json`, originais ou notas privadas;
- o restore reproduz exatamente as entradas públicas;
- o checksum interno é independente do nome externo do ZIP;
- o portal e os providers Google não são necessários para validar ou restaurar o pacote.
