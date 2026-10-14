# Stepuli — an AI Bluks project

Stepuli is the user-selected project name for the **Little Steps** English maths tutor prototype. The interface is branded Stepuli; historical internal identifiers still use Little Steps. It offers small hints, checks supported learner answers, and shows complete worked examples when requested. It aims toward accessible offline learning; it is not a validated full grade 7 tutor.

The web app, checked lesson logic and language model are separate components. This repository contains the app source and experiment documentation. Experimental model weights are distributed separately. It does not contain the base model, a bundled runtime, user chats or hosted service configuration.

## Run the app

Install Node.js 22 or newer, then run:

```sh
git clone https://github.com/aibluks/stepuli.git
cd stepuli
npm test
npm start
```

Open http://127.0.0.1:3000. There are no npm runtime dependencies. Practice cards and supported exact arithmetic/lesson guides work without a model. Other chat questions require a separately running compatible local model API.

For a model API on port 8080:

```sh
MODEL_API_URL=http://127.0.0.1:8080 MODEL_ID=stepuli-v8 npm start
```

`MODEL_API_URL` must use loopback HTTP. `MODEL_ID` must match the running server's alias; omit it to let that server select its model. `PORT` defaults to 3000 and `TUTOR_PROMPT_FILE` defaults to `tutor-prompt.txt`. Both the app and the example model server bind to the local computer. Classroom networking, shared accounts and internet hosting need separate work.

## Experimental V8 adapter download

[Download the 6.56 MB adapter from Hugging Face](https://huggingface.co/aibluks/stepuli-gemma-4-e2b-v8-experimental/resolve/0c0c453e625cc463bb079ffdec17d577b9a570d1/tutor-v8-response-pilot-lora.gguf?download=true) · [GitHub pre-release download](https://github.com/aibluks/stepuli/releases/download/v0.1.0-v8-experimental/tutor-v8-response-pilot-lora.gguf).

Both public adapter downloads were fetched anonymously and verified against the SHA-256 below. The weight file is distributed separately and is not stored in this Git repository. Save it as `models/experimental/tutor-v8-response-pilot-lora.gguf` before using the adapter command below. The adapter requires a matching unchanged base; it is not a standalone model. The standalone model is available through the verified GitHub transport download below. The single-file Hugging Face upload remains pending and unverified.

SHA-256: `5df52bab5cad5d667f302b897219e9dfb46f28dc16494854b0c10128bfced9ec`

This adapter requires an unchanged matching Gemma 4 E2B base GGUF. It is **not a standalone model** and has not been promoted into the development app. Do not load it on the earlier V2 merged model or stack it with another tutor adapter. Read the [model card](models/experimental/MODEL_CARD.md) and [evaluation evidence](models/experimental/results/teaching-review-report.txt) before using it.

Matched Colab tests showed 118/127 numeric retention answers versus 117/127 for the untouched base; both scored 15/20 on fresh maths. Teaching passes increased from 17/36 to 21/36, but useful incorrect-step tutoring remained only 1/12. The model still falsely praised wrong arithmetic and sometimes failed to finish a worked solution. These checks were synthetic and manually reviewed by Codex, not a schoolteacher or children. This is an experimental release, not a demonstrated general improvement or classroom-ready tutor.

## Run a model locally on Linux or macOS

Install a compatible [llama.cpp](https://github.com/ggml-org/llama.cpp) build for your machine. The development runtime used release b11429; no compiled runtime is shipped here. Obtain or convert a compatible unchanged [Gemma 4 E2B instruction base](https://huggingface.co/unsloth/gemma-4-E2B-it) separately, following its license and runtime documentation.

The pilot's source revision was `d36bdd3855c82a6a1a23f7c459b749f5724ae75d`. The local evaluation base was `gemma-4-E2B-it-base-Q4_K_M.gguf`, 3,106,738,272 bytes, SHA-256 `740185b21d22ceb83a11c3aa62ad5842ef32c70f6096d756bbee85a1e4ec34b8`. This repository does not distribute that file or establish that every similarly named conversion is compatible.

With your compatible base file and `llama-server` on your PATH:

```sh
BASE_GGUF=/path/to/your/compatible-base.gguf
llama-server -m "$BASE_GGUF"   --lora models/experimental/tutor-v8-response-pilot-lora.gguf   --host 127.0.0.1 --port 8080 -c 4096 --parallel 1   --alias stepuli-v8 --jinja -ngl 0
```

In another terminal, start the app with the matching alias as above. `-ngl 0` is a CPU starting point; acceleration and memory use depend on your build and device. An 8 GB Linux computer or Raspberry Pi has not been benchmarked for useful response speed, total memory, sustained thermals or multiple learners. Multiple monitors do not establish model-serving capacity.

## Download and run the standalone Q4 model

[GitHub experimental release](https://github.com/aibluks/stepuli/releases/tag/v0.1.0-v8-experimental) provides the complete standalone model as **16 byte transport parts** plus a [checked download script](https://github.com/aibluks/stepuli/releases/download/v0.1.0-v8-experimental/download.sh). All 16 public downloads were fetched anonymously; each part hash and the ordered reconstructed full-file SHA-256 matched the frozen model. The byte parts cannot be loaded separately as GGUF files.

The script downloads and checks the parts, then assembles `stepuli-v8-experimental-Q4_K_M.gguf`: **3,106,738,304 bytes**, SHA-256 `00ab71619a71fad1260eb3ea5ce6071e4a4face0a2b36a4a7b0a918f0690626b`. Allow at least **6.3 GB free disk** for retained parts plus the assembled file; failed-transfer backups may need extra space. Disk space is separate from runtime RAM. The single-file Hugging Face upload is still pending and unverified.

From this checkout, copy the script into an ignored dedicated download directory and run it:

```sh
mkdir -p models/local
cp models/experimental/transport/download.sh models/local/
sh models/local/download.sh
llama-server --model models/local/stepuli-v8-experimental-Q4_K_M.gguf --host 127.0.0.1 --port 8082 --ctx-size 4096 --parallel 1 --threads 4 --jinja --alias stepuli-v8-experimental -ngl 0
```

The script verifies the full checksum before reporting success. It retains the parts for user-controlled cleanup and checks existing files when resuming. The assembled model contains the base plus the V8 adapter merged once; **do not add `--lora`**. Weights remain outside this Git source tree.

After verifying the checksum, start the app in another terminal:

```sh
MODEL_API_URL=http://127.0.0.1:8082 MODEL_ID=stepuli-v8-experimental npm start
```

`models/local` is ignored by Git. The compact standalone file scored 14/20 on local fresh maths, with serious arithmetic and tutoring failures; those results are separate from the Colab BF16 pilot. It remains experimental.

## Teaching and offline scope

The app has 13 maths topics and 28 authored practice questions, including arithmetic, fractions, mixed operations, ratios, percentages, angles, surface area and mean/frequency. It distinguishes checked practice/verified arithmetic from generated local-model replies. Supported expressions use exact fraction arithmetic; equivalent supported metric-area answers are checked separately. It does not execute generated model HTML or code.

The service worker caches interface assets. Installing the web app does not install the model or start its API. Chats stay in tab memory and are lost on refresh. The localhost server must run to process chats; cached interface availability does not make every server-backed route work offline by itself. All assets in this checkout are local. English and science courses shown as upcoming are not implemented curriculum.

## Validation and optional backend

`npm test` runs the checked arithmetic, lesson progression, unit equivalence and request-validation tests. GitHub Actions runs the same tests on Node.js 22. Tests establish bounded app behavior, not raw-model quality. See [optional backend SQL](backend/README.md) for schema sources; there is no hosted database configuration or active cloud connection in this checkout.

The V8 pilot used 20 optimizer steps with effective batch 32: **640 example presentations**, not a complete pass through the 3,760-row training set or all of grade 7. Training loss, GPU utilization and successful export are not teaching-quality gates.

## License

Apache License 2.0; see [LICENSE](LICENSE) and [NOTICE](NOTICE). The model adapter has its own adjacent license, modification notice and model card. Stepuli is independent of Google DeepMind and Unsloth and claims no endorsement or upstream trademark rights.
