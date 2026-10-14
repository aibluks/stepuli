# Stepuli experimental model — smaller download parts

Publisher: **AI Bluks**. These are **byte transport parts, not independently loadable GGUF shards**. Download all 16 parts and assemble them before loading the model. Individual parts are at most 200,000,000 bytes; the last is 106,738,304 bytes. Splitting changes packaging, not model weights or quality.

[Release assets](https://github.com/aibluks/stepuli/releases/tag/v0.1.0-v8-experimental) · [Source](https://github.com/aibluks/stepuli) · [Model repository](https://huggingface.co/aibluks/stepuli-gemma-4-e2b-v8-experimental)

The release Files/Assets listing determines what is actually downloadable. This document is a packaging guide, not a claim that all public uploads have been verified.

## Download, check, and assemble

Allow **at least 6.3 GB free disk** for the parts plus assembled model. Failed-transfer backups can require additional space. The downloader retains parts; you decide whether to remove them afterwards. Runtime and app memory requirements are separate.

Save the script in a dedicated directory and run it there:

```sh
mkdir -p stepuli-download
cd stepuli-download
curl --fail --location --retry 3 \
  --output download.sh \
  https://github.com/aibluks/stepuli/releases/download/v0.1.0-v8-experimental/download.sh
sh download.sh
```

Requirements: a POSIX shell, `curl`, standard shell tools, and either `sha256sum` or macOS `shasum`. No Python, login, provider key, or author-specific machine configuration is required.

The script downloads the five accompanying metadata files and all 16 model parts. It checks metadata, every part, and the final model. Valid existing parts are reused. Incomplete `.partial` files are resumed only with a subsequent size and SHA256 check. Refused HTTP range requests, including 416, fall back to a fresh download; an invalid resumed transfer receives a full retry. Invalid complete files are preserved under `.invalid.*` names. No transport parts or user data are automatically deleted. An interrupted assembly output is recreated from the verified parts.

The assembled file is:

- `stepuli-v8-experimental-Q4_K_M.gguf`
- **3,106,738,304 bytes**
- SHA256: `00ab71619a71fad1260eb3ea5ce6071e4a4face0a2b36a4a7b0a918f0690626b`

For manual download, obtain every numbered part from 001 through 016 plus the six metadata assets: `README.md`, `LICENSE`, `NOTICE`, `SHA256SUMS`, `download.sh`, and `transport-manifest.json`. `SHA256SUMS` covers the 16 parts and five other metadata files; it excludes itself. `transport-manifest.json` records exact part sizes and hashes, and the assembled model identity.

## Run the assembled model

Use a llama.cpp build supporting Gemma 4 for your operating system and processor:

```sh
llama-server \
  --model stepuli-v8-experimental-Q4_K_M.gguf \
  --host 127.0.0.1 --port 8082 \
  --ctx-size 4096 --parallel 1 --threads 4 --jinja \
  --alias stepuli-v8-experimental
```

**Do not point the runtime at a `.part` file. Do not add `--lora`.** This assembled model already contains the base and the V8 adapter merged once. It must not be merged again or have another tutor adapter stacked onto it. The web app and runtime are separate downloads. A local app can connect to `http://127.0.0.1:8082/v1`.

The development Mac used official llama.cpp b11429. Apple Silicon can use `--n-gpu-layers 99` for Metal offload; Linux needs its own appropriate executable. Linux functionality and performance, 8 GB suitability, Raspberry Pi speed, concurrency, and classroom readiness remain unverified. Test the complete app with networking disabled before claiming offline readiness.

## Experimental results and provenance

The exact compact model scored **14/20** on fresh local maths in greedy nonthinking mode with 512 output tokens. The untouched Q4 nonthinking reference also scored 14/20 with identical numeric replies. The separately tested untouched thinking reference scored 20/20 with a different output budget. No improvement over that reference is claimed.

Known local failures include returning `1` for `3+5-6*4/2` instead of `-4`, returning `11/30` for `7/10-2/15` instead of `17/30`, falsely praising `22` for `8×3`, and stopping short on an explicit square-root worked-solution request. This is not a validated child-facing tutor, complete grade 7 curriculum, or model promoted into the project app.

The V8 pilot trained a fresh Gemma 4 E2B base with attention-only LoRA, rank 8/alpha 16, for 20 steps. The standalone compact file was derived by merging into the unchanged Q4 base and then quantizing only the adapted tensors, preserving unadapted tensors unchanged. It is not a recovered BF16 model. The transport parts concatenate byte-for-byte to that exact tested standalone file. License and modification provenance accompany the assets.
