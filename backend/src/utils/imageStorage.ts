import { randomUUID } from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// Compresses to webp and saves under /uploads, returns the public URL path to store on the model.
export async function saveCompressedImage(buffer: Buffer, subdir: string): Promise<string> {
  const dir = path.join(UPLOAD_DIR, subdir);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  await sharp(buffer).resize(1600, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(dir, filename));
  return `/uploads/${subdir}/${filename}`;
}
