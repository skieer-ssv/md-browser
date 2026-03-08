"use client";

import { useState, useEffect } from "react";
import { getDirectoryContents, FileEntry } from "@/app/actions/fs";
import { exportDirectoryToHTML } from "@/app/actions/export";
import { Folder, FileText, ChevronUp, Loader2, AlertCircle, Download } from "lucide-react";

export default function Sidebar({
    currentDir,
    setCurrentDir,
    selectedFile,
    onSelectFile,
}: {
    currentDir: string;
    setCurrentDir: (dir: string) => void;
    selectedFile: string | null;
    onSelectFile: (file: string) => void;
}) {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (!currentDir) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        getDirectoryContents(currentDir)
            .then((entries) => {
                if (isMounted) {
                    setFiles(entries);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err.message);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [currentDir]);

    const handleUpDirectory = () => {
        const isWindows = currentDir.includes("\\");
        const separator = isWindows ? "\\" : "/";
        const parts = currentDir.split(separator);

        // If we're at the root, don't do anything
        if (currentDir === "/" || (isWindows && parts.length === 2 && parts[1] === "")) return;

        parts.pop();
        let newDir = parts.join(separator);

        if (!isWindows && newDir === "") {
            newDir = "/";
        } else if (isWindows && newDir.endsWith(":")) {
            newDir += "\\";
        }

        setCurrentDir(newDir);
    };

    const handleExport = async () => {
        if (!currentDir || files.length === 0) return;

        try {
            setExporting(true);
            const htmlString = await exportDirectoryToHTML(currentDir);

            const blob = new Blob([htmlString], { type: 'text/html' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;

            const isWindows = currentDir.includes("\\");
            const parts = currentDir.split(isWindows ? "\\" : "/").filter(Boolean);
            const folderName = parts.length > 0 ? parts[parts.length - 1] : "export";

            a.download = `${folderName}_export.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("Export failed:", err);
            alert(`Failed to export: ${err.message}`);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="bg-neutral-900/40 flex flex-col h-full shrink-0 shadow-lg z-10">
            <div className="px-4 py-3.5 border-b border-neutral-800 flex items-center justify-between gap-3 bg-neutral-900/80 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                        onClick={handleUpDirectory}
                        className="shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all active:scale-95 border border-transparent hover:border-neutral-700 shadow-sm"
                        title="Go up one folder"
                    >
                        <ChevronUp size={18} />
                    </button>
                    <div
                        className="text-sm font-medium truncate text-neutral-300 flex-1 whitespace-nowrap overflow-hidden text-ellipsis select-none"
                        title={currentDir}
                    >
                        {currentDir || "Loading..."}
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting || files.filter(f => !f.isDirectory).length === 0}
                    className="shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all border border-transparent hover:border-neutral-700 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neutral-400 disabled:hover:border-transparent flex items-center justify-center gap-2 group"
                    title="Export folder as standalone web app"
                >
                    {exporting ? <Loader2 size={16} className="animate-spin text-blue-400" /> : <Download size={16} className="group-hover:text-blue-400 transition-colors" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {loading ? (
                    <div className="p-6 flex flex-col items-center justify-center text-neutral-500 gap-3">
                        <Loader2 size={24} className="animate-spin text-blue-500/50" />
                        <span className="text-sm font-medium">Loading directory...</span>
                    </div>
                ) : error ? (
                    <div className="p-4 text-red-400 text-sm flex gap-3 items-start bg-red-950/20 rounded-xl m-2 border border-red-900/50 shadow-inner">
                        <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                        <span className="break-words leading-snug">{error}</span>
                    </div>
                ) : files.length === 0 ? (
                    <div className="p-8 text-center text-sm text-neutral-500 mt-10 flex flex-col items-center gap-3">
                        <div className="p-4 bg-neutral-800/30 rounded-full border border-neutral-800">
                            <Folder size={24} className="opacity-40" />
                        </div>
                        <span>No markdown files or folders here.</span>
                    </div>
                ) : (
                    files.map((entry) => (
                        <div
                            key={entry.path}
                            onClick={() => entry.isDirectory ? setCurrentDir(entry.path) : onSelectFile(entry.path)}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-all duration-200 group ${selectedFile === entry.path
                                ? "bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                                : "text-neutral-300 hover:bg-neutral-800/60 hover:text-white border border-transparent"
                                }`}
                        >
                            <div className={`p-1.5 rounded-md transition-colors ${selectedFile === entry.path ? 'bg-blue-500/10' : 'bg-neutral-800/50 group-hover:bg-neutral-700/50'}`}>
                                {entry.isDirectory ? (
                                    <Folder size={16} className={`shrink-0 ${selectedFile === entry.path ? 'text-blue-400' : 'text-amber-500/80'}`} />
                                ) : (
                                    <FileText size={16} className={`shrink-0 ${selectedFile === entry.path ? 'text-blue-400' : 'text-blue-300/60'}`} />
                                )}
                            </div>
                            <span className="truncate flex-1 tracking-wide">{entry.name}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
