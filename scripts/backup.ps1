# Cria um snapshot (.zip) do projeto antes de qualquer alteracao.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/backup.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/backup.ps1 -Motivo "antes-do-layout"
#   powershell -ExecutionPolicy Bypass -File scripts/backup.ps1 -Destino "D:\Backups\Simulado-Prime"
#
# O zip inclui o codigo e o historico do git, e ignora pastas geradas
# (node_modules, .next, .vercel...), que sao recriadas por npm install / build.

[CmdletBinding()]
param(
  # Pasta do projeto. Por padrao, a pasta acima de scripts/.
  [string]$Projeto = '',
  # Pasta onde os zips serao gravados (fora do repositorio, para nao pesar no git).
  [string]$Destino = 'E:\Backups\Simulado-Prime',
  # Texto opcional que entra no nome do arquivo, ex.: "antes-do-layout".
  [string]$Motivo = '',
  # Quantos backups manter; os mais antigos sao apagados.
  [int]$Manter = 30
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if ($Projeto.Trim().Length -gt 0) {
  $projeto = (Resolve-Path $Projeto).Path
} else {
  $projeto = Split-Path -Parent $PSScriptRoot
}
if (-not (Test-Path (Join-Path $projeto 'package.json'))) {
  throw "Nao encontrei o package.json em '$projeto'. Informe -Projeto <caminho> ou rode de dentro de scripts/."
}

$pastasIgnoradas = @('node_modules', '.next', '.vercel', 'out', 'coverage', '.turbo', '.swc')
$arquivosIgnorados = @('tsconfig.tsbuildinfo')

if (-not (Test-Path $Destino)) {
  New-Item -ItemType Directory -Path $Destino -Force | Out-Null
}

$carimbo = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$sufixo = ''
if ($Motivo.Trim().Length -gt 0) {
  $limpo = ($Motivo.Trim().ToLower() -replace '[^a-z0-9\-]+', '-').Trim('-')
  if ($limpo.Length -gt 0) { $sufixo = '_' + $limpo }
}
$nomeZip = "Simulado-Prime_$carimbo$sufixo.zip"
$caminhoZip = Join-Path $Destino $nomeZip

Write-Host "Projeto : $projeto"
Write-Host "Backup  : $caminhoZip"

$arquivos = Get-ChildItem -Path $projeto -Recurse -File -Force | Where-Object {
  $relativo = $_.FullName.Substring($projeto.Length + 1)
  $partes = $relativo -split '[\\/]'
  $ignorar = $false
  foreach ($parte in $partes) {
    if ($pastasIgnoradas -contains $parte) { $ignorar = $true; break }
  }
  if (-not $ignorar -and ($arquivosIgnorados -contains $_.Name)) { $ignorar = $true }
  -not $ignorar
}

if ($arquivos.Count -eq 0) {
  throw "Nenhum arquivo encontrado para o backup."
}

$zip = [System.IO.Compression.ZipFile]::Open($caminhoZip, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($arquivo in $arquivos) {
    $relativo = $arquivo.FullName.Substring($projeto.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip,
      $arquivo.FullName,
      $relativo,
      [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
  }
}
finally {
  $zip.Dispose()
}

# Confere se o zip abre e quantas entradas tem.
$verificacao = [System.IO.Compression.ZipFile]::OpenRead($caminhoZip)
try {
  $entradas = $verificacao.Entries.Count
}
finally {
  $verificacao.Dispose()
}

$tamanhoMb = [math]::Round((Get-Item $caminhoZip).Length / 1MB, 1)
Write-Host "OK: $entradas arquivos, $tamanhoMb MB"

# Retencao: mantem apenas os N mais recentes.
$antigos = Get-ChildItem -Path $Destino -Filter 'Simulado-Prime_*.zip' -File |
  Sort-Object LastWriteTime -Descending |
  Select-Object -Skip $Manter

foreach ($antigo in $antigos) {
  Remove-Item $antigo.FullName -Force
  Write-Host "Removido (retencao): $($antigo.Name)"
}

Write-Host "Backups na pasta: $((Get-ChildItem -Path $Destino -Filter 'Simulado-Prime_*.zip' -File).Count)"
