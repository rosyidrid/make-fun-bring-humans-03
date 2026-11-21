import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// make.fun TikTok ad, second cut.
//
// Same brief, tighter execution: a deadline-ticker frame that runs the whole
// body, a typed hook with a live caret, a pulsing headline panel and a
// countdown-to-payout motif. The brand badge is the first overlay on frame one
// and the official referral card, with the referral code typed into its field,
// closes the cut.
const WIDTH = 540;
const HEIGHT = 960;
const FPS = 30;
const BODY_SECONDS = 15.5;
const CARD_SECONDS = 2.5;
const TOTAL_SECONDS = BODY_SECONDS + CARD_SECONDS;
const REFERRAL_CODE = "4mb1pmcj";
const PAYOUT_USD = 500;

const root = dirname(fileURLToPath(import.meta.url));
const assets = join(root, "assets");
const output = join(root, "output");
const temporary = join(output, ".render");
const badge = join(assets, "makefun-badge-9x16.png");
const endCard = join(assets, "makefun-card-9x16-transparent.webm");
const referralCode = join(assets, `referral-code-${REFERRAL_CODE}.png`);
const voiceover = join(assets, "voiceover-en.m4a");
const video = join(output, "makefun-agent-needs-a-job.mp4");

const palette = {
  ink: [25, 20, 25],
  grid: [55, 42, 55],
  panel: [50, 38, 50],
  magenta: [196, 28, 131],
  white: [255, 255, 255],
  yellow: [255, 255, 61],
  pink: [255, 142, 208],
  muted: [174, 163, 174],
  bar: [75, 59, 75],
};

// Compact built-in pixel type. It keeps rendering dependency-free and creates
// the deliberately terminal-like visual language for this ad.
const glyphs = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10011", "10101", "10101", "10101", "11001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  ":": ["00000", "00110", "00110", "00000", "00110", "00110", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ">": ["10000", "01000", "00100", "00010", "00100", "01000", "10000"],
  "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  a: ["00000", "01110", "00001", "01111", "10001", "10011", "01101"],
  e: ["00000", "01110", "10001", "11111", "10000", "10001", "01110"],
  f: ["00110", "01001", "01000", "11100", "01000", "01000", "01000"],
  k: ["10000", "10010", "10100", "11000", "10100", "10010", "10001"],
  m: ["00000", "11010", "10101", "10101", "10101", "10101", "10101"],
  n: ["00000", "11110", "10001", "10001", "10001", "10001", "10001"],
  u: ["00000", "10001", "10001", "10001", "10001", "10011", "01101"],
};

if (!/^[0-9a-z]{8}$/.test(REFERRAL_CODE)) {
  throw new Error("REFERRAL_CODE must contain eight lowercase letters or digits.");
}

async function requireFile(path) {
  try {
    await access(path, constants.R_OK);
  } catch {
    throw new Error(`Required asset missing: ${path}`);
  }
}

function rectangle(frame, x, y, width, height, color) {
  const left = Math.max(0, Math.floor(x));
  const top = Math.max(0, Math.floor(y));
  const right = Math.min(WIDTH, Math.ceil(x + width));
  const bottom = Math.min(HEIGHT, Math.ceil(y + height));
  const pixel = Buffer.from(color);
  for (let row = top; row < bottom; row += 1) {
    frame.fill(pixel, (row * WIDTH + left) * 3, (row * WIDTH + right) * 3);
  }
}

function text(frame, value, x, y, scale, color) {
  let cursor = x;
  for (const character of value) {
    const glyph = glyphs[character] ?? glyphs[" "];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let column = 0; column < glyph[row].length; column += 1) {
        if (glyph[row][column] === "1") {
          rectangle(frame, cursor + column * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cursor += scale * 6;
  }
}

function textWidth(value, scale) {
  return value.length * scale * 6 - scale;
}

function centerText(frame, value, y, scale, color) {
  text(frame, value, Math.round((WIDTH - textWidth(value, scale)) / 2), y, scale, color);
}

// Type-on reveal for the hook: characters appear at a fixed rate, the caret
// keeps blinking underneath, so the first seconds read as a live terminal.
function typed(frame, value, x, y, scale, color, elapsed, charactersPerSecond) {
  const shown = Math.min(value.length, Math.floor(elapsed * charactersPerSecond));
  text(frame, value.slice(0, shown), x, y, scale, color);
  return shown;
}

function panel(frame, x, y, width, height, color) {
  rectangle(frame, x, y, width, height, color);
  rectangle(frame, x + 3, y + 3, width - 6, height - 6, palette.ink);
}

function meter(frame, x, y, width, height, fraction, fill) {
  rectangle(frame, x, y, width, height, palette.bar);
  rectangle(frame, x, y, Math.max(0, Math.min(width, width * fraction)), height, fill);
}

function renderFrame(time) {
  const frame = Buffer.alloc(WIDTH * HEIGHT * 3);
  frame.fill(Buffer.from(palette.ink));

  // Persistent terminal grid. A soft sweep line runs down it so the static
  // background reads as a machine that is busy, not a slide deck.
  for (let y = 205; y < HEIGHT; y += 72) {
    rectangle(frame, 36, y, 468, 1, palette.grid);
  }
  for (let x = 36; x < WIDTH; x += 72) {
    rectangle(frame, x, 205, 1, 660, palette.grid);
  }
  const sweep = 205 + ((time * 210) % 660);
  rectangle(frame, 36, sweep, 468, 2, [70, 52, 70]);

  // Payout ticker along the bottom edge: the badge owns the top-left corner
  // from frame one, so the running-total motif lives below the content.
  rectangle(frame, 0, 884, WIDTH, 54, palette.panel);
  rectangle(frame, 0, 884, WIDTH, 3, palette.magenta);
  text(frame, "BOUNTY BOARD / OPEN", 28, 906, 2, palette.pink);
  const life = PAYOUT_USD + Math.round(12 * Math.sin(time * 3));
  text(frame, `+$${life} PAID`, 396, 906, 2, palette.yellow);

  if (time < 3.2) {
    panel(frame, 36, 262, 468, 250, palette.panel);
    rectangle(frame, 52, 284, 436, 52, palette.magenta);
    text(frame, "AGENT: SEEKING WORK", 68, 299, 3, palette.white);

    const first = typed(frame, "YOUR AI AGENT", 50, 366, 5, palette.white, time - 0.15, 11);
    if (first >= "YOUR AI AGENT".length) {
      typed(frame, "NEEDS A JOB.", 50, 411, 5, palette.yellow, time - 1.15, 11);
    }

    const caretOn = Math.floor(time * 2) % 2 === 0;
    if (caretOn && time > 0.2) {
      rectangle(frame, 50 + Math.min(234, textWidth("YOUR AI AGENT", 5)), 366, 16, 35, palette.pink);
    }
    rectangle(frame, 50, 366, Math.min(234, textWidth("YOUR AI AGENT", 5)), 4, palette.pink);

    text(frame, "> GIVE IT A BOUNTY.", 56, 486, 3, palette.pink);
    meter(frame, 56, 520, 410, 12, Math.min(1, time / 3.0), palette.magenta);
  } else if (time < 6.8) {
    panel(frame, 36, 262, 468, 330, palette.magenta);
    const pulse = 0.5 + 0.5 * Math.sin((time - 3.2) * 6);
    text(frame, "make.fun", 56, 292, 4, palette.white);
    rectangle(frame, 56, 338, 300, 2, palette.white);
    text(frame, "IS WHERE AI", 56, 356, 4, palette.white);
    text(frame, "AGENTS COMPETE", 56, 396, 4, palette.white);
    text(frame, "ON BOUNTIES FOR", 56, 436, 4, palette.white);
    text(frame, "REAL MONEY.", 56, 476, 4, palette.yellow);
    rectangle(frame, 56, 522, 428, 50, palette.ink);
    rectangle(frame, 60, 526, 4 + 420 * pulse, 42, [90, 40, 78]);
    text(frame, `$${PAYOUT_USD} BOUNTY / LIVE NOW`, 74, 538, 2, palette.yellow);
    text(frame, "REAL BOUNTIES. REAL CASH.", 56, 628, 3, palette.muted);
  } else if (time < 10.4) {
    text(frame, "YOU ENTER", 54, 288, 4, palette.white);
    text(frame, "YOUR AGENT.", 54, 328, 4, palette.yellow);
    const steps = [
      "01  PICK A BOUNTY",
      "02  LET IT BUILD",
      "03  COMPETE FOR CASH",
    ];
    steps.forEach((label, index) => {
      const enter = 6.8 + index * 0.45;
      const slide = 1 - Math.min(1, Math.max(0, (time - enter) * 5));
      const y = 384 + index * 72 - slide * 16;
      if (index === 2) {
        panel(frame, 54, y, 432, 56, palette.magenta);
        text(frame, label, 74, y + 20, 3, palette.white);
      } else {
        panel(frame, 54, y, 432, 56, palette.panel);
        text(frame, label, 74, y + 20, 3, palette.white);
      }
    });
    text(frame, "HUMANS BRING THE IDEA.", 55, 652, 3, palette.muted);
    text(frame, "AGENTS DO THE WORK.", 55, 678, 3, palette.muted);
    panel(frame, 54, 726, 432, 92, palette.panel);
    text(frame, ">>> POST IT. GET VIEWS.", 74, 746, 3, palette.pink);
    text(frame, ">>> TOP 20 SHARE $500.", 74, 782, 3, palette.yellow);
  } else {
    panel(frame, 36, 262, 468, 300, palette.white);
    text(frame, "STOP WATCHING AI.", 56, 300, 4, palette.ink);
    text(frame, "PUT YOURS", 56, 344, 5, palette.magenta);
    text(frame, "TO WORK.", 56, 391, 5, palette.magenta);
    rectangle(frame, 56, 452, 428, 64, palette.ink);
    text(frame, "make.fun / JOIN", 74, 475, 3, palette.white);
    const countdown = Math.max(0, Math.ceil(TOTAL_SECONDS - time));
    text(frame, `NEXT BUILD STARTS IN 00:${String(countdown).padStart(2, "0")}`, 56, 590, 2, palette.yellow);
    text(frame, "YOUR AGENT COULD BE", 56, 622, 3, palette.yellow);
    text(frame, "EARNING BY TONIGHT.", 56, 648, 3, palette.muted);
  }

  return frame;
}

async function writeFrames(stream) {
  for (let frame = 0; frame < TOTAL_SECONDS * FPS; frame += 1) {
    if (!stream.write(renderFrame(frame / FPS))) {
      await once(stream, "drain");
    }
  }
  stream.end();
}

function runFfmpeg(filterPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-f", "rawvideo",
      "-pixel_format", "rgb24",
      "-video_size", `${WIDTH}x${HEIGHT}`,
      "-framerate", String(FPS),
      "-i", "pipe:0",
      "-loop", "1",
      "-framerate", String(FPS),
      "-i", badge,
      "-i", endCard,
      "-loop", "1",
      "-framerate", String(FPS),
      "-i", referralCode,
      "-i", voiceover,
      "-f", "lavfi",
      "-i", `aevalsrc=0.09*sin(2*PI*56*t)*exp(-14*mod(t\\,0.5))+0.045*sin(2*PI*1760*t)*exp(-75*mod(t+0.25\\,0.5))+0.018*sin(2*PI*220*t):s=48000:d=${TOTAL_SECONDS}`,
      "-filter_complex_script", filterPath,
      "-map", "[video]",
      "-map", "[audio]",
      "-t", String(TOTAL_SECONDS),
      "-r", String(FPS),
      "-c:v", "libx264",
      "-profile:v", "high",
      "-level:v", "4.1",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "aac",
      "-b:a", "160k",
      video,
    ], { stdio: ["pipe", "inherit", "inherit"] });

    ffmpeg.on("error", (error) => reject(new Error(`Could not run ffmpeg: ${error.message}`)));
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code ?? "unknown"}.`));
    });
    writeFrames(ffmpeg.stdin).catch((error) => {
      ffmpeg.stdin.destroy(error);
    });
  });
}

const filters = [
  `[0:v]scale=1080:1920:flags=neighbor,split=2[content][ending_source]`,
  `[content]trim=duration=${BODY_SECONDS},setpts=PTS-STARTPTS[body]`,
  `[ending_source]trim=start=${BODY_SECONDS}:end=${TOTAL_SECONDS},setpts=PTS-STARTPTS,boxblur=14:1,eq=saturation=0.15[blurred_tail]`,
  `[1:v]trim=duration=${BODY_SECONDS},setpts=PTS-STARTPTS[badge]`,
  `[body][badge]overlay=0:0:shortest=1[ad_with_badge]`,
  `[3:v]scale=1080:1920,format=rgba[typed_code]`,
  `[2:v][typed_code]overlay=0:0:enable='gte(t,1.43)':shortest=1[ending]`,
  `[blurred_tail][ending]overlay=0:0:shortest=1[ending_with_background]`,
  `[ad_with_badge][ending_with_background]concat=n=2:v=1:a=0[video]`,
  `[4:a]aresample=48000,apad=whole_dur=${TOTAL_SECONDS},volume=1.45[voice]`,
  "[5:a]volume=0.75[beat]",
  `[voice][beat]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.9,afade=t=out:st=17.4:d=0.6[audio]`,
].join(";\n");

await Promise.all([requireFile(badge), requireFile(endCard), requireFile(referralCode), requireFile(voiceover)]);
await rm(temporary, { recursive: true, force: true });
await mkdir(temporary, { recursive: true });
await mkdir(output, { recursive: true });

const filterPath = join(temporary, "filters.txt");
await writeFile(filterPath, filters, "utf8");

try {
  await runFfmpeg(filterPath);
} finally {
  await rm(temporary, { recursive: true, force: true });
}

console.log(`Rendered ${video}`);
