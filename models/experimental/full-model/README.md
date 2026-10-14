# Stepuli V8 experimental full model

This directory documents separately prepared standalone GGUF candidates with the V8 pilot adapter already merged. The multi-gigabyte weight files are not included in this GitHub checkout; no verified public full-model download is claimed here. They need **no separate base download and no `--lora` flag**. These candidates have known maths and tutoring failures and are provided for developer evaluation. They are not approved for the project app or classroom use.

## Small offline candidate

`stepuli-v8-experimental-Q4_K_M.gguf`

- Size: **3,106,738,304 bytes** (about 3.11 GB decimal, 2.89 GiB).
- SHA256: `00ab71619a71fad1260eb3ea5ce6071e4a4face0a2b36a4a7b0a918f0690626b`.
- Architecture: `gemma4`; 601 tensors; Q4_K_M file type.
- The unchanged Q4 base was merged with the V8 adapter once. The 140 modified tensors were then quantized with Q4_K_M policy. All 461 unadapted tensors were verified byte-for-byte unchanged. No already-quantized unadapted tensor was requantized.

This is a derivative of an already quantized base. It is **not** an original BF16-weight merge and should not be advertised as equivalent to the Colab BF16 model. The exact artifact needs its own evaluation.

## Mixed-precision comparison candidate

`experimental-v8-q4base-merged-mixed.gguf`

- Size: **3,532,038,240 bytes**.
- SHA256: `55d5b4196d03615822361055b9d3f7bfbf15f868858e5cb00ccb6cfd6499f3b7`.
- Its 140 adapted tensors are F16; all others retain their original types. The exporter labels its file type F16, but the actual tensor mixture includes quantized tensors. It is not a full original F16 model.

The official llama.cpp `llama-export-lora` binary b11429 (`d81235049`) dequantized adapted base tensors to F32, added the scaled adapter, and saved those tensors as F16. Its exact source was checked against the official commit. Six of seven frozen greedy smoke replies matched the separate Q4 base plus adapter; one capacity hint changed wording. This small comparison does not prove equivalence. Both configurations returned wrong answers for two numeric smoke questions and failed some tutoring cases.

## Run locally

If you already have the separately obtained GGUF, keep its license, notice, and checksum alongside a llama.cpp runtime that supports Gemma 4 for your operating system and processor. The Mac binary included in the development workspace is not a Linux executable. Obtain the correct Linux build separately when preparing Linux machines.

Verify the model before loading it:

```sh
# Linux
sha256sum stepuli-v8-experimental-Q4_K_M.gguf
# macOS
shasum -a 256 stepuli-v8-experimental-Q4_K_M.gguf
```

Start a local API with the standalone file:

```sh
llama-server \
  --model stepuli-v8-experimental-Q4_K_M.gguf \
  --host 127.0.0.1 --port 8082 \
  --ctx-size 4096 --parallel 1 --threads 4 --jinja \
  --alias stepuli-v8-experimental
```

On the tested Apple Silicon runtime, adding `--n-gpu-layers 99` enables Metal offload. CPU-only Linux can omit that flag. Actual Linux functionality and speed remain untested. Connect a local web app to `http://127.0.0.1:8082/v1`; the model file is not itself a web app. Keep the provided tutor system prompt and explicitly select thinking or nonthinking mode in requests. Record settings when comparing results.

Do not apply any tutor LoRA on top of these merged files. Do not use the earlier V2 merged model as a base. Do not treat file size as a guarantee that the complete app, operating system, context cache, and concurrent sessions fit in 8 GB RAM.

After the initial runtime, app, and model downloads, test with networking disabled to verify the complete offline flow. No model-hosted API or paid service is needed for local inference. Linux/Pi speed, thermals, multi-monitor usage, and memory capacity have not been established.

## Evidence and limits

`full-model-manifest.json` describes the mixed candidate; `q4-full-model-manifest.json` describes the compact derivative. `merge-smoke-results.json` records both separate-adapter and mixed results. `q4-fresh20-results.json`, `q4-fresh20-score.json`, and `q4-smoke-results.json` describe the compact file’s own local test when complete. Read exact results before choosing a file; BF16 Colab scores do not transfer automatically.

The adapter’s broader evaluation found false praise of incorrect learner steps. It is not a reliable tutor, a validated grade 7 curriculum, or a substitute for teacher supervision. This publication is an experimental artifact, not an improvement claim over the untouched base running in thinking mode.

License and provenance are in the adjacent project `LICENSE` and `NOTICE`. Gemma 4’s official license is [Apache 2.0](https://ai.google.dev/gemma/apache_2); this independent project does not claim Google endorsement.
