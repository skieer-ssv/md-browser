"use server";

import fs from "fs/promises";
import path from "path";
import os from "os";

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
}

export async function getHomeDirectory() {
  return os.homedir();
}

export async function getDirectoryContents(
  dirPath: string = os.homedir()
): Promise<FileEntry[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    const processedEntries: FileEntry[] = [];

    for (const entry of entries) {
      // Basic filtering: ignore hidden files and node_modules
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }

      if (entry.isDirectory()) {
        processedEntries.push({
          name: entry.name,
          path: path.join(dirPath, entry.name),
          isDirectory: true,
        });
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        const filePath = path.join(dirPath, entry.name);
        try {
          const stats = await fs.stat(filePath);
          processedEntries.push({
            name: entry.name,
            path: filePath,
            isDirectory: false,
            size: stats.size,
          });
        } catch (e) {
          // If stat fails (e.g., permissions), just push without size
          processedEntries.push({
            name: entry.name,
            path: filePath,
            isDirectory: false,
          });
        }
      }
    }

    // Sort: directories first, then alphabetical
    return processedEntries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
  } catch (error: any) {
    console.error(`Failed to read directory ${dirPath}:`, error);
    throw new Error(`Failed to read directory: ${error.message}`);
  }
}

export async function getFileContent(filePath: string): Promise<string> {
  try {
    if (!filePath.toLowerCase().endsWith(".md")) {
      throw new Error("Only markdown files are supported");
    }
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error: any) {
    console.error(`Failed to read file ${filePath}:`, error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
}
