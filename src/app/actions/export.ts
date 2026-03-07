"use server";

import fs from "fs/promises";
import path from "path";
import { getDirectoryContents } from "./fs";

export async function exportDirectoryToHTML(dirPath: string): Promise<string> {
    const entries = await getDirectoryContents(dirPath);
    const mdFiles = entries.filter(
        (e) => !e.isDirectory && e.path.toLowerCase().endsWith(".md")
    );

    const fileData: Record<string, string> = {};
    for (const file of mdFiles) {
        try {
            const content = await fs.readFile(file.path, "utf-8");
            fileData[file.name] = content;
        } catch (error) {
            console.error(`Failed to read ${file.path} for export:`, error);
        }
    }

    const directoryName = path.basename(dirPath) || dirPath;
    const serializedData = JSON.stringify(fileData).replace(/</g, "\\x3c");

    const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>md-browser: ${directoryName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>
    <style>
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        
        .prose { max-width: none; color: #d4d4d4; line-height: 1.7; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; }
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 { color: #fff; font-weight: 600; margin-top: 2em; margin-bottom: 1em; letter-spacing: -0.025em; }
        .prose h1 { font-size: 2.25em; }
        .prose h2 { font-size: 1.5em; border-bottom: 1px solid #404040; padding-bottom: 0.3em; }
        .prose h3 { font-size: 1.25em; }
        .prose p { margin-top: 1.2em; margin-bottom: 1.2em; }
        .prose a { color: #60a5fa; text-decoration: underline; text-underline-offset: 4px; }
        .prose pre { background: rgba(23, 23, 23, 0.8); padding: 1.25em; border-radius: 0.75rem; overflow-x: auto; border: 1px solid rgba(64, 64, 64, 0.8); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
        .prose code { color: #93c5fd; background: rgba(59, 130, 246, 0.1); padding: 0.125rem 0.375rem; border-radius: 0.375rem; }
        .prose pre code { color: inherit; background: none; padding: 0; }
        .prose blockquote { border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.05); padding: 0.5rem 1.5rem; border-top-right-radius: 0.75rem; border-bottom-right-radius: 0.75rem; margin: 1.5rem 0; font-style: normal; color: #d4d4d4; }
        .prose ul { list-style-type: disc; padding-left: 1.5em; margin: 1em 0; }
        .prose ol { list-style-type: decimal; padding-left: 1.5em; margin: 1em 0; }
        .prose li::marker { color: #525252; }
        .prose img { border-radius: 0.75rem; border: 1px solid #262626; max-width: 100%; height: auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .prose table { width: 100%; text-align: left; border-collapse: collapse; margin: 2em 0; }
        .prose th { border-bottom: 1px solid #404040; background: rgba(23, 23, 23, 0.5); padding: 0.75rem 1rem; }
        .prose td { border-bottom: 1px solid rgba(64, 64, 64, 0.5); padding: 0.75rem 1rem; }
        .prose hr { border-color: #262626; margin: 2em 0; }
    </style>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        neutral: {
                            950: '#0a0a0a',
                            900: '#171717',
                            800: '#262626',
                            700: '#404040',
                            600: '#525252',
                            500: '#737373',
                            400: '#a3a3a3',
                            300: '#d4d4d4',
                            200: '#e5e5e5',
                        }
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-neutral-950 text-neutral-200 font-sans h-screen flex overflow-hidden selection:bg-blue-500/30 selection:text-blue-200">
    <div id="app" class="flex h-full w-full"></div>

    <script>
        const fileData = ${serializedData};
        const directoryName = \`${directoryName.replace(/`/g, "\\`")}\`;

        // Configure marked to use GitHub Flavored Markdown features implicitly
        
        document.addEventListener('DOMContentLoaded', () => {
            const app = document.getElementById('app');
            const fileNames = Object.keys(fileData).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));
            let selectedFile = fileNames[0] || null;

            function renderSidebar() {
                return \`
                    <div class="w-72 lg:w-80 border-r border-neutral-800 bg-neutral-900/40 flex flex-col h-full shrink-0 shadow-lg z-10">
                        <div class="px-4 py-3.5 border-b border-neutral-800 flex items-center gap-3 bg-neutral-900/80 sticky top-0 z-10 backdrop-blur-xl">
                            <div class="text-sm font-medium truncate text-neutral-300 flex-1 whitespace-nowrap overflow-hidden text-ellipsis select-none" title="\${directoryName}">
                                \${directoryName}
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                            \${fileNames.length === 0 ? \`
                                <div class="p-8 text-center text-sm text-neutral-500 mt-10 flex flex-col items-center gap-3">
                                    <div class="p-4 bg-neutral-800/30 rounded-full border border-neutral-800">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-40"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.2-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>
                                    </div>
                                    <span>No markdown files</span>
                                </div>
                            \` : fileNames.map(name => \`
                                <div onclick="selectFile('\${name.replace(/'/g, "\\'")}')" class="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-all duration-200 group \${selectedFile === name ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white border border-transparent'}">
                                    <div class="p-1.5 rounded-md transition-colors \${selectedFile === name ? 'bg-blue-500/10' : 'bg-neutral-800/50 group-hover:bg-neutral-700/50'}">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 \${selectedFile === name ? 'text-blue-400' : 'text-blue-300/60'}"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                    </div>
                                    <span class="truncate flex-1 tracking-wide">\${name}</span>
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                \`;
            }

            function renderViewer() {
                if (!selectedFile) {
                    return \`
                        <div class="flex-1 overflow-y-auto w-full bg-[#0a0a0a] relative custom-scrollbar flex items-center justify-center flex-col gap-5">
                            <div class="p-6 bg-neutral-900/50 rounded-full border border-neutral-800 shadow-xl relative overflow-hidden group">
                                <svg class="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p class="text-lg font-medium tracking-wide text-neutral-400">Select a file</p>
                        </div>
                    \`;
                }

                const rawContent = fileData[selectedFile];
                const parsedContent = DOMPurify.sanitize(marked.parse(rawContent, { gfm: true, breaks: true }));

                return \`
                    <div class="flex-1 overflow-y-auto w-full bg-[#0a0a0a] relative custom-scrollbar shadow-[-10px_0px_30px_-15px_rgba(0,0,0,0.5)]">
                        <div class="sticky top-0 z-10 backdrop-blur-xl bg-neutral-950/60 border-b border-neutral-800/80 px-8 py-4 flex items-center justify-between shadow-sm">
                            <h2 class="text-lg font-medium text-neutral-200 truncate pr-4">\${selectedFile}</h2>
                            <div class="flex items-center gap-2 text-xs font-medium text-neutral-500 bg-neutral-900/50 px-3 py-1.5 rounded-full border border-neutral-800">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-70"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
                                <span>Exported static view</span>
                            </div>
                        </div>
                        <div class="max-w-4xl mx-auto p-8 md:p-12 lg:p-16 pb-32 transition-all duration-300">
                            <div class="prose max-w-none">
                                \${parsedContent}
                            </div>
                        </div>
                    </div>
                \`;
            }

            function render() {
                app.innerHTML = renderSidebar() + renderViewer();
            }

            window.selectFile = (name) => {
                selectedFile = name;
                render();
            };

            render();
        });
    </script>
</body>
</html>`;

    return html;
}
