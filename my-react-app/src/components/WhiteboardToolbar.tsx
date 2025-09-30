import { useCallback, useEffect, useState } from "react";


function findCanvas(): HTMLCanvasElement | null {
  return document.querySelector("canvas"); // whiteboard ka <canvas>
}

function download(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function WhiteboardToolbar() {
  const [msg, setMsg] = useState("");

  const toast = useCallback((text: string) => {
    setMsg(text);
    const id = setTimeout(() => setMsg(""), 2000);
    return () => clearTimeout(id);
  }, []);

  const onCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Link copied ✅");
    } catch {
      toast("Copy failed");
    }
  }, [toast]);

  const onExportPng = useCallback(() => {
    const c = findCanvas();
    if (!c) return toast("No canvas found");
    try {
      const url = c.toDataURL("image/png");
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      download(url, `whiteboard-${ts}.png`);
      toast("Exported PNG ✅");
    } catch {
      toast("Export failed");
    }
  }, [toast]);

  const onClear = useCallback(() => {
    const c = findCanvas();
    if (!c) return toast("No canvas found");
    if (!confirm("Clear the board (local view)?")) return;
    const ctx = c.getContext("2d");
    if (!ctx) return toast("2D context missing");
    ctx.save();
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();
    toast("Cleared (local) 🧹");
  }, [toast]);

  const onToggleFullscreen = useCallback(() => {
    const c = findCanvas();
    const target = c?.parentElement ?? document.documentElement;
    if (!document.fullscreenElement) target.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  // Shortcuts: ⌘/Ctrl+S export, ⌘/Ctrl+Shift+C copy, ⌘/Ctrl+K clear, F fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (mod && k === "s") { e.preventDefault(); onExportPng(); }
      else if (mod && e.shiftKey && k === "c") { e.preventDefault(); onCopyLink(); }
      else if (mod && k === "k") { e.preventDefault(); onClear(); }
      else if (k === "f") { onToggleFullscreen(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCopyLink, onExportPng, onClear, onToggleFullscreen]);

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 9999,
          display: "flex",
          gap: 8,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "8px 10px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          alignItems: "center",
        }}
      >
        <button onClick={onCopyLink} title="Copy board link (Cmd/Ctrl+Shift+C)">Copy Link</button>
        <button onClick={onExportPng} title="Export PNG (Cmd/Ctrl+S)">Export PNG</button>
        <button onClick={onClear} title="Clear local canvas (Cmd/Ctrl+K)">Clear</button>
        <button onClick={onToggleFullscreen} title="Toggle fullscreen (F)">Fullscreen</button>
      </div>

      {msg && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(17,17,17,0.95)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 13,
            zIndex: 9999,
          }}
        >
          {msg}
        </div>
      )}
    </>
  );
}
