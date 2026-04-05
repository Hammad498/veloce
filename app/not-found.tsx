import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <div className="flex items-center gap-3 justify-center">
          <Link href="/" className="text-sm bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors">
            Submit a brief
          </Link>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Team login →
          </Link>
        </div>
      </div>
    </main>
  );
}
