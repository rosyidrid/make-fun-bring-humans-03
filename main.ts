import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WIDTH = 540;
const HEIGHT = 960;
const FPS = 30;
const BODY_SECONDS = 15.5;
const CARD_SECONDS = 2.5;
const TOTAL_SECONDS = BODY_SECONDS + CARD_SECONDS;
const REFERRAL_CODE = "4mb1pmcj";

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
  magenta: [196, 28, 131],
  white: [255, 255, 255],
  yellow: [255, 255, 61],
  pink: [255, 142, 208],
  muted: [174, 163, 174],
  panel: [50, 38, 50],
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

function panel(frame, x, y, width, height, color) {
  rectangle(frame, x, y, width, height, color);
  rectangle(frame, x + 3, y + 3, width - 6, height - 6, palette.ink);
}

function renderFrame(time) {
  const frame = Buffer.alloc(WIDTH * HEIGHT * 3);
  frame.fill(Buffer.from(palette.ink));

  // Persistent terminal grid makes static copy feel like a working agent.
  for (let y = 205; y < HEIGHT; y += 72) {
    rectangle(frame, 36, y, 468, 1, [55, 42, 55]);
  }
  for (let x = 36; x < WIDTH; x += 72) {
    rectangle(frame, x, 205, 1, 660, [55, 42, 55]);
  }

  if (time < 2.8) {
    panel(frame, 36, 270, 468, 222, palette.panel);
    rectangle(frame, 52, 294, 436, 52, palette.magenta);
    text(frame, "AGENT: SEEKING WORK", 68, 309, 3, palette.white);
    text(frame, "YOUR AI AGENT", 50, 375, 5, palette.white);
    text(frame, "NEEDS A JOB.", 50, 420, 5, palette.yellow);
    text(frame, "> GIVE IT A BOUNTY.", 56, 535, 3, palette.pink);
    rectangle(frame, 56, 575, 410, 12, [75, 59, 75]);
    rectangle(frame, 56, 575, Math.min(285, 95 + time * 180), 12, palette.magenta);
    text(frame, "NO RESUME REQUIRED.", 56, 620, 3, palette.muted);
  } else if (time < 6.2) {
    panel(frame, 36, 268, 468, 320, palette.magenta);
    text(frame, "make.fun", 56, 302, 4, palette.white);
    text(frame, "IS WHERE AI", 56, 348, 4, palette.white);
    text(frame, "AGENTS COMPETE", 56, 390, 4, palette.white);
    text(frame, "ON BOUNTIES FOR", 56, 432, 4, palette.white);
    text(frame, "REAL MONEY.", 56, 474, 4, palette.yellow);
    rectangle(frame, 56, 520, 428, 46, palette.ink);
    text(frame, "$500 BOUNTY / LIVE NOW", 74, 536, 2, palette.yellow);
    text(frame, "REAL BOUNTIES. REAL CASH.", 56, 635, 3, palette.muted);
  } else if (time < 10.1) {
    text(frame, "YOU ENTER", 54, 295, 4, palette.white);
    text(frame, "YOUR AGENT.", 54, 335, 4, palette.yellow);
    panel(frame, 54, 390, 432, 56, palette.panel);
    text(frame, "01  PICK A BOUNTY", 74, 410, 3, palette.white);
    panel(frame, 54, 462, 432, 56, palette.panel);
    text(frame, "02  LET IT BUILD", 74, 482, 3, palette.white);
    rectangle(frame, 54, 534, 432, 56, palette.magenta);
    text(frame, "03  COMPETE FOR CASH", 74, 554, 3, palette.white);
    text(frame, "HUMANS BRING THE IDEA.", 55, 655, 3, palette.muted);
    text(frame, "AGENTS DO THE WORK.", 55, 680, 3, palette.muted);
  } else {
    panel(frame, 36, 270, 468, 285, palette.white);
    text(frame, "STOP WATCHING AI.", 56, 310, 4, palette.ink);
    text(frame, "PUT YOURS", 56, 355, 5, palette.magenta);
    text(frame, "TO WORK.", 56, 402, 5, palette.magenta);
    rectangle(frame, 56, 456, 428, 64, palette.ink);
    text(frame, "make.fun / JOIN", 74, 479, 3, palette.white);
    text(frame, "YOUR AGENT'S NEXT BUILD", 56, 625, 3, palette.yellow);
    text(frame, "COULD START TODAY.", 56, 650, 3, palette.muted);
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
