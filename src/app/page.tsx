"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MarkdownViewer from "@/components/MarkdownViewer";
import { getHomeDirectory } from "@/app/actions/fs";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export default function Home() {
  const [currentDir, setCurrentDir] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Initialize to home directory on mount
    getHomeDirectory().then(setCurrentDir).catch(console.error);

    // Keyboard shortcut to toggle sidebar (Cmd+B or Ctrl+B)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="flex h-screen bg-neutral-950 text-neutral-200 overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <div
        className={`transition-all duration-300 ease-in-out h-full overflow-hidden shrink-0 ${isSidebarOpen ? "w-72 lg:w-80 border-r border-neutral-800" : "w-0 border-r-0"
          }`}
      >
        <div className="w-72 lg:w-80 h-full">
          <Sidebar
            currentDir={currentDir}
            setCurrentDir={setCurrentDir}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full bg-[#0a0a0a] relative custom-scrollbar shadow-[-10px_0px_30px_-15px_rgba(0,0,0,0.5)]">
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`fixed bottom-6 ${isSidebarOpen ? "left-[304px] lg:left-[336px]" : "left-6"} z-50 p-2.5 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all duration-300 shadow-2xl active:scale-95 group overflow-hidden`}
          title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        {selectedFile ? (
          <MarkdownViewer filePath={selectedFile} />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-500 flex-col gap-5 animate-in fade-in duration-700">
            <div className="p-6 bg-neutral-900/50 rounded-full border border-neutral-800 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <svg className="w-10 h-10 opacity-40 group-hover:opacity-80 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-medium tracking-wide text-neutral-400">Select a file to begin</p>
          </div>
        )}
      </div>
    </main>
  );
}
