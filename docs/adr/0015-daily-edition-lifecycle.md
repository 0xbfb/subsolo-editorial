# ADR 0015 — Ciclo de vida da edição diária

**Status:** aceito

O estado operacional privado usa `planejada`, `aberta`, `publicada` e `selada`. O contrato público só nasce na primeira publicação e usa `publicada`, `selada` ou `corrigida`. Slots reservados, abertos, pautas adiadas e retiradas nunca entram no manifesto público.
