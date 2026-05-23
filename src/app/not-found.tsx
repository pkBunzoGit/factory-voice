import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-300">404</h1>
        <p className="text-gray-600">This page doesn't exist.</p>
        <Link
          href="/"
          className="inline-block text-sm text-blue-600 hover:underline"
        >
          Go to homepage
        </Link>
      </div>
    </main>
  );
}
