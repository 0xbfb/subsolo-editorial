# Validação manual — Jornal Concreto

1. instalar dependências quando o registry estiver disponível;
2. executar `pnpm dev`;
3. abrir `/` em 1440 px e 390 px;
4. confirmar manchete principal sem sublinhado;
5. confirmar títulos secundários e canais sublinhados;
6. alternar papel, recarregar e confirmar persistência;
7. navegar por teclado do skip link ao botão de tema;
8. testar com JavaScript desativado;
9. abrir `/__design/jornal-concreto/` diretamente;
10. executar `pnpm test:e2e:update` para criar os snapshots canônicos;
11. executar `pnpm test:e2e` novamente sem atualização;
12. confirmar ausência de overflow horizontal.
