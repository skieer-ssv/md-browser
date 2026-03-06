"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getFileContent } from "@/app/actions/fs";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import path from "path";

export default function MarkdownViewer({ filePath }: { filePath: string }) {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState("");

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        const isWindows = filePath.includes("\\");
        const parts = filePath.split(isWindows ? "\\" : "/");
        setFileName(parts[parts.length - 1] || "File");

        // Initial load
        const loadContent = async () => {
            try {
                const text = await getFileContent(filePath);
                if (isMounted) {
                    setContent(text);
                    setLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        loadContent();

        // Set up polling for real-time updates (every 2 seconds)
        // The user requested: "It should take realtime files and not store older versions"
        const interval = setInterval(async () => {
            try {
                const newText = await getFileContent(filePath);
                if (isMounted && newText !== content) {
                    setContent(newText);
                }
            } catch (e) {
                // Silently ignore errors on polling to not disrupt UI
            }
        }, 2000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [filePath, content]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-4 animate-in fade-in">
                <Loader2 className="animate-spin w-10 h-10 opacity-40 text-blue-500" />
                <p className="text-sm tracking-widest uppercase opacity-60">Loading Content</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 h-full flex items-center justify-center animate-in fade-in">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-lg text-center shadow-2xl">
                    <AlertCircle className="w-12 h-12 text-red-500/80 mx-auto mb-4" />
                    <h3 className="font-semibold text-xl mb-3 text-red-200">Error loading file</h3>
                    <p className="text-red-400/80">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full relative min-h-full">
            {/* Header bar */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-neutral-950/60 border-b border-neutral-800/80 px-8 py-4 flex items-center justify-between shadow-sm">
                <h2 className="text-lg font-medium text-neutral-200 truncate pr-4">
                    {fileName}
                </h2>
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 bg-neutral-900/50 px-3 py-1.5 rounded-full border border-neutral-800">
                    <RefreshCw size={12} className="animate-spin-slow opacity-70" style={{ animationDuration: '3s' }} />
                    <span>Live sync active</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-8 md:p-12 lg:p-16 animate-in slide-in-from-bottom-4 fade-in duration-700 ease-out pb-32">
                <div className="prose prose-invert prose-neutral max-w-none 
            prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:underline-offset-4
            prose-p:leading-relaxed prose-p:text-neutral-300
            prose-pre:bg-neutral-900/80 prose-pre:border prose-pre:border-neutral-800/80 prose-pre:shadow-xl prose-pre:rounded-xl
            prose-code:text-blue-300 prose-code:bg-blue-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
            prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-500/5 prose-blockquote:px-6 py-2 prose-blockquote:rounded-r-xl prose-blockquote:text-neutral-300 prose-blockquote:not-italic
            prose-img:rounded-xl prose-img:shadow-2xl prose-img:border prose-img:border-neutral-800
            prose-hr:border-neutral-800
            prose-th:border-b prose-th:border-neutral-800 prose-th:bg-neutral-900/50 prose-th:px-4 prose-th:py-3
            prose-td:border-b prose-td:border-neutral-800/50 prose-td:px-4 prose-td:py-3
            prose-li:marker:text-neutral-600
          ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
