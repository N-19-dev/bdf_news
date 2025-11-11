// frontend/scripts/copy-export.js
import { existsSync, rmSync, mkdirSync, cpSync } from "fs";
import { resolve } from "path";

// 📂 Dossier source = backend/export/
const SRC = resolve(process.cwd(), "..", "backend", "export");

// 📁 Dossier destination = frontend/public/export/
const DST = resolve(process.cwd(), "public", "export");

if (!existsSync(SRC)) {
  console.error(`[copy-export] Source introuvable: ${SRC}`);
  console.error("→ Lance d'abord : cd backend && python3 main.py");
  process.exit(1);
}

if (existsSync(DST)) rmSync(DST, { recursive: true, force: true });
mkdirSync(resolve(process.cwd(), "public"), { recursive: true });
cpSync(SRC, DST, { recursive: true });

console.log(`[copy-export] ✅ Copié ${SRC} → ${DST}`);