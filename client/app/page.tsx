"use client";

import { useState } from "react";

export default function Home() {
  const [diff, setDiff] = useState<string>("");
  const [commits, setCommits] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateCommits = async (): Promise<void> => {
    if (!diff.trim()) {
      setError("Please paste a git diff first.");
      return;
    }

    setLoading(true);
    setError("");
    setCommits([]);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/generate-commits`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diff }),
        }
      );

      const data: { commits?: string[]; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setCommits(data.commits || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect to the server.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fixed signature
  const copyToClipboard = (text: string, index: number): void => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);

    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Commit Generator
          </h1>
          <p className="text-zinc-500">
            Paste your git diff below to generate conventional commit messages.
          </p>
        </header>

        {/* Input */}
        <div className="mb-6">
          <textarea
            className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-xl p-5 font-mono text-sm text-zinc-300 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none shadow-inner"
            placeholder={`Paste your git diff here...\n\nExample:\n+ function calculateTotal(price, tax) {\n+   return price + (price * tax);\n+ }`}
            value={diff}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDiff(e.target.value)
            }
          />

          <button
            onClick={generateCommits}
            disabled={loading}
            className={`mt-4 w-full py-4 rounded-xl font-semibold text-white transition-all flex justify-center items-center ${
              loading
                ? "bg-zinc-800 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 active:scale-[0.98]"
            }`}
          >
            {loading ? (
              <span className="animate-pulse">Analyzing Code...</span>
            ) : (
              "Generate Commits"
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-950/50 border border-red-900 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Output */}
        {commits.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
              Suggested Commits
            </h3>

            {commits.map((commit: string, index: number) => (
              <div
                key={index}
                className="group flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-lg hover:border-zinc-700 transition-colors"
              >
                <code className="font-mono text-sm text-blue-400">
                  {commit}
                </code>

                <button
                  onClick={() => copyToClipboard(commit, index)}
                  className="text-xs font-medium text-zinc-500 hover:text-white px-3 py-1.5 bg-zinc-800 rounded-md transition-colors"
                >
                  {copiedIndex === index ? "Copied!" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
