#!/bin/sh

DENO_DIR="${HOME}/.deno/bin/deno"
rm -rf ./space/picTrans
rm -rf ./space/public
if [ ! -f "${DENO_DIR}" ]; then
    curl -fsSL https://deno.land/x/install/install.sh | sh
fi
~/.deno/bin/deno compile --allow-read --allow-net --allow-write main.ts
mv pic-trans ./space/picTrans
cp -r public ./space/public
# upx -9 ./space/picTrans
cd space
space push