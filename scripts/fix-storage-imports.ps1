param()
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

$files = @(
    "src/app/api/files/route.ts",
    "src/app/api/files/[id]/route.ts",
    "src/app/api/public-files/[id]/route.ts"
)

foreach ($file in $files) {
    $path = Join-Path (Get-Location) $file
    if (-not (Test-Path $path)) {
        Write-Host "File tidak ditemukan: $path"
        continue
    }

    $text = [System.IO.File]::ReadAllText($path, $utf8NoBom)
    $original = $text

    $text = $text -replace [regex]::Escape("@/lib/storage"), "@/server/storage"

    if ($text -ne $original) {
        [System.IO.File]::WriteAllText($path, $text, $utf8NoBom)
        Write-Host "Updated: $file"
    }
}

Write-Host "Selesai - import @/lib/storage sudah diperbaiki"
