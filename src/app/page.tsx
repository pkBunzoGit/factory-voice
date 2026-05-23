import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FactoryVoice</h1>
          <p className="mt-2 text-sm text-gray-500">
            AI-powered customer assistant for manufacturers
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/agent/login"
            className="block w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Agent Login
          </Link>
          <Link
            href="/owner/login"
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Owner Login
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          Version 1.0 — Web-Chat Model
        </p>
      </div>
    </main>
  );
}
