# ADR 0013 — Arquivo técnico imutável no Google Drive

**Status:** aceito  
**Data:** 2026-07-20

## Contexto

O pacote diário precisa sobreviver fora do repositório, sem transformar o Drive em banco público ou permitir que nomes de arquivos sejam usados como prova de identidade.

## Decisão

- a CLI opera sob uma pasta raiz `SUBSOLO` explicitamente autorizada;
- o destino é `90_ARQUIVO_TECNICO/edicoes/YYYY/MM`;
- o scope padrão é `https://www.googleapis.com/auth/drive.file`;
- OAuth do usuário ou conta de serviço em Shared Drive são os modos operacionais preferidos;
- upload usa o protocolo resumível da Drive API v3;
- o SHA-256 do ZIP é a chave de idempotência e fica em `appProperties`;
- a busca de duplicidade combina pasta-pai, MIME, `trashed=false` e `appProperties`;
- após upload, a CLI consulta metadata, confirma tamanho e MD5, baixa o arquivo e executa a validação do pacote;
- o `file_id` só entra no recibo local depois da verificação integral;
- o relatório não contém URL privada nem URI da sessão resumível;
- a integração nunca apaga, substitui ou publica arquivos.

## Consequências

- uma execução repetida retorna `already-archived` em vez de duplicar;
- uma interrupção pode retomar a sessão;
- a primeira homologação real exige uma raiz compartilhada e credencial externa ao repositório;
- `drive.file` pode exigir que a pasta seja concedida explicitamente ao aplicativo; scope completo não é ativado silenciosamente;
- Git e pull request continuam fora desta etapa.

## Fontes técnicas

- Google Drive API — Upload file data: `https://developers.google.com/workspace/drive/api/guides/manage-uploads`
- Google Drive API — Search for files and folders: `https://developers.google.com/workspace/drive/api/guides/search-files`
- Google Drive API — Custom file properties: `https://developers.google.com/workspace/drive/api/guides/properties`
