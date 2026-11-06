param()
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

$replacements = @{
    "@/server/modules/events/admin-view"           = "@/ui/components/modules/events-admin-view";
    "@/server/modules/documentation/admin-view"    = "@/ui/components/modules/documentation-admin-view";
    "@/server/modules/finance/laporan-view"        = "@/ui/components/modules/finance-laporan-view";
    "@/server/modules/finance/transaksi-view"      = "@/ui/components/modules/finance-transaksi-view";
    "@/server/modules/programs/admin-view"         = "@/ui/components/modules/programs-admin-view";
    "AgendaAdminView"                               = "EventsAdminView";
    "DokumentasiAdminView"                          = "DocumentationAdminView";
    "LaporanKeuanganAdminView"                      = "FinanceLaporanView";
    "TransaksiAdminView"                            = "FinanceTransaksiView";
    "ProgramKerjaAdminView"                         = "ProgramsAdminView";
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
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Selesai - semua import view files sudah diperbaiki"
