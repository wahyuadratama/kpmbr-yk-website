param()
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

function Replace-InFiles {
    param(
        [hashtable]$Replacements,
        [string]$Label
    )
    $files = Get-ChildItem -Recurse -Path src -Include *.ts,*.tsx
    $count = 0
    foreach ($f in $files) {
        $text = [System.IO.File]::ReadAllText($f.FullName, $utf8NoBom)
        $original = $text
        foreach ($old in $Replacements.Keys) {
            $text = $text -replace [regex]::Escape($old), $Replacements[$old]
        }
        if ($text -ne $original) {
            [System.IO.File]::WriteAllText($f.FullName, $text, $utf8NoBom)
            Write-Host "[$Label] Updated $($f.FullName)"
            $count++
        }
    }
    Write-Host "[$Label] Done - $count file(s) updated."
}

$group = $env:IMPORT_GROUP
if (-not $group) { $group = "1" }

switch ($group) {
    "1" {
        Replace-InFiles -Label "K1" -Replacements @{
            "@/lib/db/"      = "@/server/db/";
            "@/lib/auth/"    = "@/server/auth/";
            "@/lib/actions/" = "@/server/actions/";
        }
    }
    "2" {
        Replace-InFiles -Label "K2" -Replacements @{
            "@/lib/storage/"  = "@/server/storage/";
            "@/lib/files/"    = "@/server/files/";
            "@/lib/settings/" = "@/server/settings/";
        }
    }
    "3" {
        Replace-InFiles -Label "K3" -Replacements @{
            "@/lib/audit"      = "@/server/audit";
            "@/lib/crypto"     = "@/server/crypto";
            "@/lib/rate-limit" = "@/server/rate-limit";
        }
    }
    "4" {
        Replace-InFiles -Label "K4" -Replacements @{
            "@/modules/" = "@/server/modules/";
        }
    }
    "5" {
        Replace-InFiles -Label "K5" -Replacements @{
            "@/components/"  = "@/ui/components/";
            "@/types/"       = "@/shared/types/";
            "@/lib/validation/" = "@/shared/validation/";
            "@/lib/utils/"   = "@/shared/utils/";
            "@/lib/content/" = "@/shared/content/";
        }
    }
    "6" {
        Replace-InFiles -Label "K6" -Replacements @{
            "@/lib/errors"     = "@/shared/errors";
            "@/lib/site-config" = "@/shared/site-config";
            "@/lib/utils"      = "@/shared/utils";
            "@/lib/navigation" = "@/ui/navigation";
            "@/lib/dashboard/" = "@/ui/dashboard/";
            "@/auth"           = "@/server/auth/config";
        }
    }
    default {
        $msg = "Unknown group: $group. Use env var IMPORT_GROUP=1..6"
        Write-Error $msg
    }
}
