# Run prisma migrate dev with mariadb->mysql scheme workaround if needed (Prisma 7 P1013)
$env:NODE_NO_WARNINGS = "1"
$raw = node -e "require('dotenv').config({quiet:true}); process.stdout.write(process.env.DATABASE_URL||'')"
if (-not $raw) { Write-Error "DATABASE_URL missing"; exit 1 }
# Prisma migrate may reject mariadb:// scheme in some 7.x setups; try mysql:// for migration tooling
$env:DATABASE_URL = $raw -replace '^mariadb://','mysql://'
npx prisma migrate dev --name add_notifications --create-only
$code = $LASTEXITCODE
exit $code
