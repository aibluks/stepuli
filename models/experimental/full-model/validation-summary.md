# Standalone V8 artifact validation

The compact file loads successfully and works without a separate adapter. This verifies packaging and runtime compatibility on the development Mac; it does not establish dependable tutoring.

| Artifact | Bytes | SHA256 |
|---|---:|---|
| Mixed merge | 3,532,038,240 | `55d5b4196d03615822361055b9d3f7bfbf15f868858e5cb00ccb6cfd6499f3b7` |
| Compact Q4_K_M derivative | 3,106,738,304 | `00ab71619a71fad1260eb3ea5ce6071e4a4face0a2b36a4a7b0a918f0690626b` |

The merger added the V8 LoRA to the untouched Q4 base once. The compact derivative quantized the 140 merged F16 tensors, preserving all 461 unadapted tensors byte-for-byte. Comparing every tensor in the final compact file against the original base found 136 changed and 465 identical tensors. Four adapted tensors quantized back to their original bytes. Changed bytes alone do not prove retained training capability.

Seven frozen smoke requests compared the separate base plus adapter against the mixed standalone merge. Six visible replies were identical, and one capacity hint changed wording. On the compact derivative, five replies matched the separate-adapter run; capacity and square-root wording changed. All runs used greedy nonthinking requests with 512 output tokens and a 4096 context, on a transient local API using llama.cpp b11429. This small test does not prove equivalence.

The compact file scored **14/20** on the frozen fresh numeric test. All 20 visible numeric replies matched the earlier untouched Q4 base nonthinking test, which also scored 14/20. The separately tested untouched base in thinking mode scored 20/20; different output budgets and inference modes prevent treating these as an isolated measure of fine-tuning effects. The Colab BF16 pilot’s 15/20 result is a different artifact and precision.

Known local smoke failures occurred with the separate adapter, mixed file, and compact file:

- `3+5-6*4/2` returned `1`; the correct result is `-4`.
- `7/10 - 2/15` returned `11/30`; the correct result is `17/30`.
- The tutor falsely accepted `22` for the current step `8×3`.
- An explicit square-root worked-solution request stopped at asking the learner to calculate `14×14`, without giving the requested completed solution.

`735/21` correctly returned `35`, and the correct intermediate multiplication control progressed to division. A capacity error received a repeated conversion question rather than a useful explanation of the specific mistake.

These are experimental downloads, not recommended replacements for the app’s current model or for the untouched base in thinking mode. The app was not changed. No Linux, Raspberry Pi, 8 GB memory, classroom, or child-use validation was performed. All temporary port 8082 servers were stopped; the existing base server on port 8081 was preserved.

Full raw results, frozen prompts, exact model hashes, and tensor checks accompany this report. Development server logs may contain local filesystem paths and are internal diagnostics; omit them from public uploads.
