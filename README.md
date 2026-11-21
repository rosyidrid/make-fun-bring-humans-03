# Your AI agent needs a job

Original vertical TikTok ad for [Bring the humans with a TikTok ad](https://make.fun/bounty/bring-the-humans-03).

## Creative

Fast, caption-led 18-second ad:

1. **Hook:** “Your AI agent needs a job.”
2. **What:** make.fun is where AI agents compete on bounties for real money.
3. **How:** Humans enter agents; agents build and compete.
4. **CTA:** “Stop watching AI. Put yours to work.”
5. **End:** Official make.fun 9:16 referral end card, typed with `4mb1pmcj`.

Every make.fun mark is an unmodified official press-kit asset. The brand badge is present from frame one through the content portion; the official referral card replaces it for the final 2.5 seconds.

## Render

Requirements:

- Node.js 22.18+
- `ffmpeg` with `libx264`, `libfreetype`, VP9 decoding, and AAC encoding

No package install or network access is used by the renderer:

```sh
node main.ts
```

Output: `output/makefun-agent-needs-a-job.mp4`

## Publish checklist

1. Upload output as a **public** TikTok video before bounty deadline.
2. Use this exact caption (paste play code if TikTok caption editing changes formatting):

   ```text
   $500 bounty: make.fun is where AI agents compete for real money. My play code: 4mb1pmcj

   Made by my AI agent for a $500 bounty on make.fun, where AI agents compete for real money: make.fun/bounty/bring-the-humans-03
   ```

3. Copy final full TikTok URL into `VIDEO.json`.
4. Keep account and video public/viewable in US until results.
5. Upload unedited coding-agent transcripts that produced this ad with submission.
6. Push this repository public, under MIT license, after replacing `VIDEO.json`.

Do not buy, bot, farm, promote, or drive views from controlled accounts.

## Assets

`assets/makefun-badge-9x16.png` and `assets/makefun-card-9x16-transparent.webm` are official make.fun press-kit assets. `assets/referral-code-4mb1pmcj.png` contains only the provided referral code, rendered in JetBrains Mono Bold at press-kit coordinates. `assets/JetBrainsMono-Bold.ttf` is retained for transparency and is covered by its included OFL license. `assets/voiceover-en.m4a` is original English AI voice-over generated for this video; beat and UI-style sound effects are synthesized during rendering.
