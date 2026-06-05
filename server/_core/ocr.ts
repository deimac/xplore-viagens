import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";

export type OcrResult = {
    text: string;
    confidence: number | null;
    engine: string;
    warnings: string[];
};

function stripDataUrl(imageDataUrl: string): Buffer {
    const base64 = imageDataUrl.includes(",") ? imageDataUrl.split(",").pop() || "" : imageDataUrl;
    if (!base64.trim()) throw new Error("Imagem vazia para OCR");
    return Buffer.from(base64, "base64");
}

function runCommand(command: string, args: string[], timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
        let stdout = "";
        let stderr = "";
        let settled = false;

        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            child.kill("SIGKILL");
            reject(new Error(`OCR timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });
        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });
        child.on("error", (err) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            reject(err);
        });
        child.on("close", (code) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (code === 0) resolve({ stdout, stderr });
            else reject(new Error(stderr.trim() || `OCR command exited with code ${code}`));
        });
    });
}

function parseTsvConfidence(tsv: string): number | null {
    const lines = tsv.trim().split(/\r?\n/);
    if (lines.length < 2) return null;
    const header = lines[0].split("\t");
    const confIndex = header.indexOf("conf");
    if (confIndex < 0) return null;

    const values = lines
        .slice(1)
        .map((line) => Number(line.split("\t")[confIndex]))
        .filter((value) => Number.isFinite(value) && value >= 0);

    if (!values.length) return null;
    const avg = values.reduce((acc, value) => acc + value, 0) / values.length;
    return Math.max(0, Math.min(1, avg / 100));
}

export async function extractTextFromImage(imageDataUrl: string): Promise<OcrResult> {
    const warnings: string[] = [];
    const tempDir = await mkdtemp(path.join(tmpdir(), "xplore-ocr-"));
    const inputPath = path.join(tempDir, "input.png");

    try {
        const imageBuffer = stripDataUrl(imageDataUrl);
        const processed = await sharp(imageBuffer)
            .rotate()
            .resize({ width: 1800, withoutEnlargement: true })
            .grayscale()
            .normalize()
            .sharpen()
            .png()
            .toBuffer();

        await writeFile(inputPath, processed);

        const baseArgs = [inputPath, "stdout", "-l", process.env.OCR_LANG || "por+eng", "--psm", process.env.OCR_PSM || "6"];
        const timeoutMs = Number(process.env.OCR_TIMEOUT_MS || 30000);
        const textResult = await runCommand(process.env.TESSERACT_BIN || "tesseract", baseArgs, timeoutMs);
        const tsvResult = await runCommand(process.env.TESSERACT_BIN || "tesseract", [...baseArgs, "tsv"], timeoutMs).catch((err) => {
            warnings.push(`Não foi possível calcular confiança OCR: ${(err as Error).message}`);
            return null;
        });

        const text = textResult.stdout.replace(/\u000c/g, "").trim();
        if (!text) warnings.push("OCR não encontrou texto legível na imagem.");

        return {
            text,
            confidence: tsvResult ? parseTsvConfidence(tsvResult.stdout) : null,
            engine: "tesseract-cli",
            warnings,
        };
    } finally {
        await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
}
