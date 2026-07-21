# Relatório sanitizado de preservação

**Ambiente:** contrato simulado da Drive API v3  
**Pacote:** fixture `r1.zip`  
**Resultado:** aprovado nos testes automatizados  
**Upload real:** não executado

## Evidências

- sessão resumível iniciada;
- três chunks confirmados em teste;
- interrupção de rede retomada após consulta de status;
- pasta técnica criada somente abaixo da raiz autorizada;
- duplicidade localizada por SHA-256;
- metadata remota verificada;
- download comparado ao SHA-256 local;
- pacote baixado aceito pelo validador;
- recibo gravado apenas após confirmação;
- nenhum token, URI de sessão ou URL privada registrado.

## Pendência externa

Homologar com uma pasta de teste real e credencial de escopo mínimo.
