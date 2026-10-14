#!/bin/sh
# Stepuli transport downloader. Save this file in a dedicated download directory,
# then run: sh download.sh. Byte parts are retained after assembly.
set -eu
BASE_URL='https://github.com/aibluks/stepuli/releases/download/v0.1.0-v8-experimental'
MODEL='stepuli-v8-experimental-Q4_K_M.gguf'
MODEL_SHA='00ab71619a71fad1260eb3ea5ce6071e4a4face0a2b36a4a7b0a918f0690626b'
MODEL_BYTES=3106738304
SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"
command -v curl >/dev/null 2>&1 || { echo 'curl is required.' >&2; exit 1; }
if command -v sha256sum >/dev/null 2>&1; then
    hash_file() { sha256sum "$1" | awk '{print $1}'; }
elif command -v shasum >/dev/null 2>&1; then
    hash_file() { shasum -a 256 "$1" | awk '{print $1}'; }
else
    echo 'Install sha256sum or shasum before downloading.' >&2
    exit 1
fi
preserve_invalid() {
    source_file=$1
    backup_file="${source_file}.invalid.$(date +%s)"
    backup_index=0
    while [ -e "$backup_file" ]; do
        backup_index=$((backup_index + 1))
        backup_file="${source_file}.invalid.$(date +%s).${backup_index}"
    done
    mv "$source_file" "$backup_file"
    echo "Preserved invalid file as $backup_file" >&2
}
fetch_fresh() {
    curl --fail --location --retry 3 --retry-delay 2 --connect-timeout 30 \
        --output "$2" "$BASE_URL/$1"
}
expected_hash() {
    awk -v name="$1" '$2 == name {print $1}' SHA256SUMS
}
verify_named() {
    wanted=$(expected_hash "$1")
    [ -n "$wanted" ] && [ -f "$1" ] && [ "$(hash_file "$1")" = "$wanted" ]
}
echo 'Stepuli: allow at least 6.3 GB free disk for parts plus assembled model.'
echo 'Failed-transfer backups can require extra space. No transport parts are deleted.'
# Small metadata is always fetched freshly and moved into place atomically.
for asset in README.md LICENSE NOTICE SHA256SUMS transport-manifest.json; do
    fetch_fresh "$asset" "${asset}.partial"
    if [ -e "$asset" ] && ! cmp -s "${asset}.partial" "$asset"; then
        preserve_invalid "$asset"
    fi
    mv "${asset}.partial" "$asset"
done
for asset in README.md LICENSE NOTICE transport-manifest.json download.sh; do
    verify_named "$asset" || { echo "Metadata checksum failed: $asset" >&2; exit 1; }
done
part_index=1
while [ "$part_index" -le 16 ]; do
    suffix=$(printf '%03d' "$part_index")
    name="${MODEL}.part-${suffix}"
    wanted=$(expected_hash "$name")
    [ -n "$wanted" ] || { echo "Missing checksum: $name" >&2; exit 1; }
    expected_bytes=200000000
    if [ "$part_index" -eq 16 ]; then expected_bytes=106738304; fi
    if [ -f "$name" ]; then
        if [ "$(hash_file "$name")" = "$wanted" ]; then
            echo "Verified existing $name"
            part_index=$((part_index + 1))
            continue
        fi
        preserve_invalid "$name"
    fi
    partial="${name}.partial"
    if [ -f "$partial" ]; then
        bytes=$(wc -c < "$partial" | tr -d '[:space:]')
        if [ "$bytes" -eq "$expected_bytes" ] && [ "$(hash_file "$partial")" = "$wanted" ]; then
            mv "$partial" "$name"
            part_index=$((part_index + 1))
            continue
        fi
        if [ "$bytes" -ge "$expected_bytes" ]; then preserve_invalid "$partial"; fi
    fi
    resumed=0
    if [ -f "$partial" ] && [ "$(wc -c < "$partial" | tr -d '[:space:]')" -gt 0 ]; then
        echo "Trying a checked resume of $name"
        if curl --fail --location --retry 3 --retry-delay 2 --connect-timeout 30 \
            --continue-at - --output "$partial" "$BASE_URL/$name"; then
            resumed=1
        else
            # Handles refused ranges/HTTP416 without endlessly repeating resume.
            preserve_invalid "$partial"
            fetch_fresh "$name" "$partial"
        fi
    else
        fetch_fresh "$name" "$partial"
    fi
    bytes=$(wc -c < "$partial" | tr -d '[:space:]')
    if [ "$bytes" -ne "$expected_bytes" ] || [ "$(hash_file "$partial")" != "$wanted" ]; then
        preserve_invalid "$partial"
        if [ "$resumed" -eq 1 ]; then
            echo "Resume integrity failed; retrying $name from the beginning." >&2
            fetch_fresh "$name" "$partial"
            bytes=$(wc -c < "$partial" | tr -d '[:space:]')
            [ "$bytes" -eq "$expected_bytes" ] && [ "$(hash_file "$partial")" = "$wanted" ] || {
                echo "Full retry checksum failed: $name; partial retained." >&2; exit 1;
            }
        else
            echo "Checksum failed: $name; invalid file retained. Run again to retry." >&2
            exit 1
        fi
    fi
    mv "$partial" "$name"
    echo "Downloaded and verified $name"
    part_index=$((part_index + 1))
done
if [ -f "$MODEL" ] && [ "$(hash_file "$MODEL")" = "$MODEL_SHA" ]; then
    echo 'Existing assembled model is correct.'
else
    if [ -e "$MODEL" ]; then preserve_invalid "$MODEL"; fi
    assembling="${MODEL}.assembling.partial"
    # This disposable assembly output is recreated; verified parts remain intact.
    : > "$assembling"
    part_index=1
    while [ "$part_index" -le 16 ]; do
        suffix=$(printf '%03d' "$part_index")
        cat "${MODEL}.part-${suffix}" >> "$assembling"
        part_index=$((part_index + 1))
    done
    bytes=$(wc -c < "$assembling" | tr -d '[:space:]')
    [ "$bytes" -eq "$MODEL_BYTES" ] && [ "$(hash_file "$assembling")" = "$MODEL_SHA" ] || {
        echo 'Assembled model checksum failed; parts and assembly output retained.' >&2; exit 1;
    }
    mv "$assembling" "$MODEL"
fi
echo 'Verified complete model. Keep or remove transport parts manually as you prefer.'
cat <<'INSTRUCTIONS'
Run a compatible llama.cpp executable for your operating system:
llama-server --model stepuli-v8-experimental-Q4_K_M.gguf --host 127.0.0.1 --port 8082 --ctx-size 4096 --parallel 1 --threads 4 --jinja --alias stepuli-v8-experimental
Do not load a .part file and do not add --lora to this merged model.
This experimental model scored 14/20 fresh maths locally and has serious tutoring errors.
Linux performance, 8 GB suitability, and classroom readiness are unverified.
INSTRUCTIONS
