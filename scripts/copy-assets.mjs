// tsc only emits .js - copy the non-TypeScript runtime assets (handlebars e-mail templates) next to it.
import { cpSync, mkdirSync } from "node:fs";

mkdirSync("dist/utils/emails", { recursive: true });
cpSync("backend/utils/emails/template", "dist/utils/emails/template", { recursive: true });
console.log("assets copied");
