import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

type Violation = {
  file: string;
  message: string;
};

const projectRoot = path.resolve(import.meta.dir, "..");
const sourceRoot = path.join(projectRoot, "src");

const forbiddenTransitionalFiles = new Set([
  "src/modules/users/repositories/users.repository.ts",
  "src/modules/serials/repositories/serials.repository.ts",
  "src/modules/people/people.service.ts",
]);

const moduleMonolithLineLimit = 380;

const toPosix = (value: string): string => value.split(path.sep).join("/");

const collectTypeScriptFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(absolutePath)));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".ts") || entry.name.endsWith(".d.ts")) {
      continue;
    }

    files.push(absolutePath);
  }

  return files;
};

const importSpecifierRegex = /from\s+["']([^"']+)["']/g;

const getImportSpecifiers = (source: string): string[] => {
  const specifiers: string[] = [];

  for (const match of source.matchAll(importSpecifierRegex)) {
    const specifier = match[1];
    if (specifier) {
      specifiers.push(specifier);
    }
  }

  return specifiers;
};

const checkFile = async (absolutePath: string): Promise<Violation[]> => {
  const source = await readFile(absolutePath, "utf8");
  const relativePath = toPosix(path.relative(projectRoot, absolutePath));
  const violations: Violation[] = [];

  if (forbiddenTransitionalFiles.has(relativePath)) {
    violations.push({
      file: relativePath,
      message: "transitional wrapper file must not be reintroduced",
    });
  }

  const lineCount = source.split("\n").length;
  if (relativePath.startsWith("src/modules/") && lineCount > moduleMonolithLineLimit) {
    violations.push({
      file: relativePath,
      message: `module file exceeds ${moduleMonolithLineLimit} lines (${lineCount})`,
    });
  }

  const imports = getImportSpecifiers(source);

  if (relativePath.endsWith(".controller.ts")) {
    for (const specifier of imports) {
      if (specifier.includes("/repositories/") || specifier.endsWith(".repository")) {
        violations.push({
          file: relativePath,
          message: `controller imports repository directly (${specifier})`,
        });
      }
    }
  }

  if (relativePath.includes("/dto/") && relativePath.endsWith(".ts")) {
    for (const specifier of imports) {
      if (
        specifier.includes("/services/") ||
        specifier.includes("/repositories/") ||
        specifier.includes(".controller")
      ) {
        violations.push({
          file: relativePath,
          message: `dto imports forbidden layer (${specifier})`,
        });
      }
    }
  }

  if (relativePath.includes("/repositories/") && relativePath.endsWith(".ts")) {
    for (const specifier of imports) {
      if (specifier.includes("/services/") || specifier.includes(".controller")) {
        violations.push({
          file: relativePath,
          message: `repository imports forbidden layer (${specifier})`,
        });
      }
    }
  }

  if (relativePath.includes("/services/") && relativePath.endsWith(".ts")) {
    for (const specifier of imports) {
      if (specifier.includes(".controller") || specifier.includes("/controllers/")) {
        violations.push({
          file: relativePath,
          message: `service imports controller layer (${specifier})`,
        });
      }
    }
  }

  return violations;
};

const run = async () => {
  const srcStats = await stat(sourceRoot);
  if (!srcStats.isDirectory()) {
    throw new Error("backend/src directory not found");
  }

  const files = await collectTypeScriptFiles(sourceRoot);
  const allViolations: Violation[] = [];

  for (const file of files) {
    allViolations.push(...(await checkFile(file)));
  }

  if (allViolations.length > 0) {
    for (const violation of allViolations) {
      console.error(`ARCH ${violation.file}: ${violation.message}`);
    }

    throw new Error(`Architecture check failed with ${allViolations.length} violation(s)`);
  }

  console.info(`Architecture check passed (${files.length} files)`);
};

await run();
