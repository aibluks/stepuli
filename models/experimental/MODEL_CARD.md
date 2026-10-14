---
language:
- en
license: apache-2.0
base_model: unsloth/gemma-4-E2B-it
pipeline_tag: text-generation
tags:
- gguf
- gemma4
- lora
- education
- experimental
---

# Stepuli — experimental Gemma 4 E2B maths tutor

Publisher: **AI Bluks** (`aibluks`). Stepuli is an AI Bluks project.

Stepuli is an experimental English maths tutoring project prepared for reproducible evaluation and further development. This source repository publishes experiment documentation; model weights are distributed separately. The small adapter has verified public downloads on Hugging Face and GitHub. The complete standalone model has a verified GitHub transport download; the single-file Hugging Face upload remains pending and unverified. It is **not a validated tutor for children**. It can falsely praise incorrect learner answers, lose the current conversation step, and produce incomplete worked solutions. Download availability does not mean this model is recommended over the untouched base.

## What was trained

Fresh `unsloth/gemma-4-E2B-it`, revision `d36bdd3855c82a6a1a23f7c459b749f5724ae75d`, with attention-module LoRA rank 8, alpha 16, no MLP adapters, learning rate 0.000005, BF16, effective batch 32, maximum training length 1024. The pilot stopped after 20 of 118 scheduled optimizer steps: 640 example presentations from a shuffled 3760-row training set. The validation set has 940 rows. Synthetic targets were not reviewed by a schoolteacher.

The final assistant reply alone was supervised; earlier conversation turns were context. Training and the paired Colab evaluation used native nonthinking formatting. The original adapter adds weights and does not contain the base model. The separately prepared standalone Q4 file contains the base and the adapter merged once; its exact provenance and results are below.

## Actual evaluation

Matched Colab BF16, greedy generation, nonthinking, maximum 512 output tokens:

| Test | Untouched base | V8 pilot |
|---|---:|---:|
| Numeric development retention | 117/127 | 118/127 |
| Fresh numeric questions | 15/20 | 15/20 |
| Teaching: pass / partial / fail | 17 / 4 / 15 | 21 / 4 / 11 |
| Correct intermediate-step progression | 8/12 | 9/12 |
| Incorrect-step tutoring passes | 1/12 | 1/12 |
| Correct, complete worked responses when stuck | 8/12 | 11/12 |

Teaching grades are a single Codex manual review of all 36 complete responses and their frozen contexts, not human teacher or child assessment. Four cases improved; no manual grade regressed. Incorrect-step failures remain serious: examples include accepting 17×6=92, 2×6=14, and 2.35 L=235 mL. A fraction solution hit the output-token limit. A correct value appearing before a truncated ending did not count as a complete response.

The old 127-question suite overlaps development and validation material; it is not a blind benchmark. The fresh questions exclude exact roots from the current training and validation set, but pretraining contamination is unknown. The teaching cases use fixed assistant histories, not conversations generated adaptively by each model.

A separate local Q4 untouched-base test scored 14/20 nonthinking and 20/20 thinking on the fresh numeric set. That result uses different precision and output budgets and is not a matched comparison with this BF16 pilot. It demonstrates why this fine-tuned release must not be advertised as the best available maths model. The earlier untouched-base thinking result on a different 36-case teaching test is also not interchangeable with these nonthinking scores.

## Standalone offline model: verified GitHub download

`stepuli-v8-experimental-Q4_K_M.gguf` is a standalone model requiring no separate base or LoRA file.

- Bytes: **3,106,738,304** (about 3.11 GB, or 2.89 GiB).
- SHA256: `00ab71619a71fad1260eb3ea5ce6071e4a4face0a2b36a4a7b0a918f0690626b`.
- Status: all 16 GitHub transport parts and six metadata assets were downloaded anonymously and verified. Ordered actual part bytes reproduced the exact full-model SHA256 above. The single-file Hugging Face upload is still pending and unverified.
- Download: [experimental GitHub release](https://github.com/aibluks/stepuli/releases/tag/v0.1.0-v8-experimental), with [download.sh](https://github.com/aibluks/stepuli/releases/download/v0.1.0-v8-experimental/download.sh) and [transport manifest](https://github.com/aibluks/stepuli/releases/download/v0.1.0-v8-experimental/transport-manifest.json).

These are byte transport parts, **not independently loadable GGUF shards**. The script checks all parts and assembles the single standalone GGUF. Allow at least **6.3 GB free disk** for parts plus the assembled file, with extra space for failed-transfer backups. Copy `models/experimental/transport/download.sh` into the checkout's ignored `models/local` directory, then run `sh models/local/download.sh`; see the root README for full setup. Runtime RAM and speed on Linux/Pi are unmeasured. Do not apply an additional LoRA to the assembled model.

It was created from the unchanged Q4_K_M base with SHA256 `740185b21d22ceb83a11c3aa62ad5842ef32c70f6096d756bbee85a1e4ec34b8` plus the V8 GGUF LoRA adapter with SHA256 `5df52bab5cad5d667f302b897219e9dfb46f28dc16494854b0c10128bfced9ec`. Official llama.cpp b11429 (`d81235049`) merged 140 adapted tensors by dequantizing those tensors to F32, adding the scaled LoRA, and saving them as F16; the other 461 tensors were copied. The resulting mixed model was then quantized under Q4_K_M policy with explicit original-type overrides for every unadapted tensor. No already-quantized unadapted tensors were requantized. All 461 were verified byte-for-byte unchanged. The final compact file differs from the original base in 136 tensors; four adapted tensors quantized back to their original bytes.

This derivative of a quantized base is **not** a merge into original BF16 weights. Its local nonthinking fresh numeric result was **14/20**, matching all 20 visible replies from the earlier untouched Q4 nonthinking base test. It did not reproduce the Colab BF16 pilot’s 15/20 score. The separately tested untouched Q4 base in thinking mode scored 20/20 with a different generation budget; do not advertise this release as an improvement over that reference.

Seven frozen local smoke requests found serious failures in the separate-adapter, mixed-merge, and compact configurations: `3+5-6*4/2` returned `1` instead of `-4`; `7/10 - 2/15` returned `11/30` instead of `17/30`; the tutor falsely praised `22` for `8×3`; and an explicit square-root worked-solution request ended with another question instead of completing the answer. The mixed merge matched six of seven separate-adapter replies; the compact file matched five of seven. These small comparisons do not prove equivalence. Port 8082 test servers were stopped and the existing app was unchanged.

See `full-model/README.md`, `full-model/validation-summary.md`, and the exact-artifact result files. The inherited internal display name remains `Stepuli V8 Experimental Q4 Derived`; the publication filename was changed without altering model bytes.

## Files and use

This GitHub source repository contains documentation and evaluation evidence. Model weights are distributed separately:

- The verified `tutor-v8-response-pilot-lora.gguf` download is 6,556,960 bytes and requires an unchanged compatible base GGUF. [Hugging Face](https://huggingface.co/aibluks/stepuli-gemma-4-e2b-v8-experimental/resolve/0c0c453e625cc463bb079ffdec17d577b9a570d1/tutor-v8-response-pilot-lora.gguf?download=true) and [GitHub pre-release](https://github.com/aibluks/stepuli/releases/download/v0.1.0-v8-experimental/tutor-v8-response-pilot-lora.gguf) full downloads both matched SHA-256 `5df52bab5cad5d667f302b897219e9dfb46f28dc16494854b0c10128bfced9ec`. The file is not stored in this Git tree.
- The complete standalone Q4 model is distributed as 16 verified byte parts in the linked GitHub release; `transport/` contains the small script, manifest, checksums, license and notice. Model weights are outside this Git tree.
- `SHA256SUMS`: exact adapter integrity.
- `LICENSE` and `NOTICE`: upstream license and modification provenance.
- `results/`: sanitized evaluation results, settings and training evidence.

GGUF weights, PEFT archives, tokenizer assets, optimizer checkpoints and full base/merged models are not included here. The adapter adds weights; it cannot generate by itself. See the repository root README for portable setup.

Do not load this adapter on `english-tutor-v2-Q4_K_M.gguf`, a previously merged tutor model, or alongside another tutor LoRA. Such combinations were not trained or evaluated here.

## Limits and intended use

Intended for adult developer experiments with English maths tutoring. It does not establish coverage or mastery of a full grade 7 curriculum, other subjects, child safeguarding, offline classroom readiness, or performance on an 8 GB Linux computer or Raspberry Pi. An app interface, exact arithmetic checker, and additional teaching controls are separate systems; raw model scores must not be attributed to those systems or vice versa.

The GitHub project is [aibluks/stepuli](https://github.com/aibluks/stepuli). Complete standalone weights are hosted separately in the linked GitHub release; cloning the source does not download them. The project web app currently uses its earlier model and guides. This V8 pilot has not been promoted into that app. It has no proved latency, concurrency, or memory guarantee on target hardware. Measure the complete app on the intended device before use.

Gemma 4 is licensed under [Apache 2.0](https://ai.google.dev/gemma/apache_2). The [older Gemma terms page](https://ai.google.dev/gemma/terms/) explicitly points Gemma 4 to its separate license. Model origin: [Google Gemma 4 E2B](https://huggingface.co/google/gemma-4-E2B-it), training base: [Unsloth Gemma 4 E2B](https://huggingface.co/unsloth/gemma-4-E2B-it). This project is independent and does not claim Google endorsement.
