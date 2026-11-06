param()
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

$replacements = @{
    "@/lib/db/prisma"           = "@/server/db/prisma";
    "@/lib/auth/password"        = "@/server/auth/password";
    "@/lib/site-config"          = "@/shared/site-config";
    "@/lib/audit"                = "@/server/audit";
    "@/lib/rate-limit"           = "@/server/rate-limit";
    "@/lib/auth/lockout"         = "@/server/auth/lockout";
    "@/lib/auth/principal"       = "@/server/auth/principal";
    "@/lib/auth/permissions"     = "@/server/auth/permissions";
    "@/lib/auth/portals"         = "@/server/auth/portals";
    "../src/lib/navigation"      = "../src/ui/navigation";
    "../src/lib/site-config"     = "../src/shared/site-config";
    "../src/lib/dashboard/nav"   = "../src/ui/dashboard/nav";
}

$files = @(
    "prisma/seed.ts",
    "scripts/check-nav-links.ts",
    "scripts/check-schema-mapping.ts",
    "scripts/db-smoke.ts",
    "scripts/test-authorization.ts"
)

foreach ($file in $files) {
    $path = Join-Path (Get-Location) $file
    if (-not (Test-Path $path)) {
        Write-Host "File tidak ditemukan: $path"
        continue
    }

    $text = [System.IO.File]::ReadAllText($path, $utf8NoBom)
    $original = $text

    foreach ($old in $replacements.Keys) {
        $text = $text -replace [regex]::Escape($old), $replacements[$old]
    }

    if ($text -ne $original) {
        [System.IO.File]::WriteAllText($path, $text, $utf8NoBom)
        Write-Host "Updated: $file"
    }
}

Write-Host "Selesai - semua import di scripts/ dan prisma/seed.ts sudah diperbaiki"
