# Arquitetura

A arquitetura do Subsolo separa domínio, aplicação, infraestrutura e apresentação.

```text
domain <- application <- presentation
   ^          ^
   └──── infrastructure
```

As integrações serão implementadas nas bordas. O domínio não conhece Astro, Google, GitHub, n8n ou HTML.
