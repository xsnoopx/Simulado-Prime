# Regras do projeto Simulado Prime

## Backup antes de qualquer alteracao

Sempre gerar um snapshot antes de editar arquivos:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup.ps1 -Motivo "antes-de-<assunto>"
```

- Os zips ficam em `E:\Backups\Simulado-Prime` (fora do repositorio, para nao pesar no git).
- Nome: `Simulado-Prime_AAAA-MM-DD_HHMMSS_<motivo>.zip`.
- Inclui o codigo e o historico `.git`; ignora `node_modules`, `.next`, `.vercel`, `out` e `coverage`.
- Retencao automatica: mantem os 30 backups mais recentes.
- Restaurar: extrair o zip em uma pasta vazia e rodar `npm install`.
- Os zips incluem arquivos locais (inclusive `.env.local`, se existir): **nao** envie a pasta de backups para nuvem nem para repositorio.

## Idioma

- Codigo, comentarios, mensagens de UI, documentacao e commits em **pt-BR**.

## Seguranca

- **Nunca** expor `SUPABASE_SERVICE_ROLE_KEY` em codigo, log, print ou commit. Ela so existe no painel da Vercel e em `.env.local`.
- A chave `NEXT_PUBLIC_SUPABASE_ANON_KEY` e publica por natureza (vai no bundle), mas precisa ser a do mesmo projeto da URL. Validacao em `lib/supabaseConfig.ts`.
- Variaveis de ambiente na Vercel: as `NEXT_PUBLIC_*` devem ser do tipo **Config** (nao Sensitive), senao o painel bloqueia a edicao.

## Regras de produto

- PRIME so libera com pagamento real. A demonstracao permanece bloqueada (`PAYMENT_ENABLED = false`).
- A splash original (emblema + COMEÇAR) nao deve ser trocada por animacao de foguete.
- Preservar a identidade visual (glass/galaxia) e priorizar desempenho em celulares modestos.

## Antes de commitar

```powershell
npx tsc --noEmit
npm run build
```

Commits em pt-BR, no formato `tipo(escopo): resumo`.
