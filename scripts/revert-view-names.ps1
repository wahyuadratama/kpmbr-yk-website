param()
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

$replacements = @{
    "EventsAdminView"           = "AgendaAdminView";
    "DocumentationAdminView"    = "DokumentasiAdminView";
    "FinanceLaporanView"        = "LaporanKeuanganAdminView";
    "FinanceTransaksiView"      = "TransaksiAdminView";
    "ProgramsAdminView"         = "ProgramKerjaAdminView";
}

$files = Get-ChildItem -Recurse -Path src/app -Include *.tsx,*.ts | Where-Object { $_.FullName -match "(admin|pengurus|bendahara)" }

foreach ($file in $files) {
    $text = [System.IO.File]::ReadAllText($file.FullName, $utf8NoBom)
    $original = $text

    foreach ($old in $replacements.Keys) {
        $text = $text -replace [regex]::Escape($old), $replacements[$old]
    }

    if ($text -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $text, $utf8NoBom)
        Write-Host "Reverted: $($file.FullName)"
    }
}

Write-Host "Selesai - nama import view files sudah dikembalikan ke nama asli"
