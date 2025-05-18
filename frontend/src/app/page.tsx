import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gradient-farm animate-pop">
      <main className="flex flex-col items-center justify-center flex-1 w-full px-4 py-16">
        <div className="glass card-shadow max-w-xl w-full flex flex-col items-center gap-8 p-8 sm:p-12 animate-pop">
        <Image
            src="/farm-hero.svg"
            alt="Vertical Farm Logo"
            width={80}
            height={80}
            className="mb-2"
          priority
        />
          <h1 className="text-4xl sm:text-5xl font-bold text-center text-green-900 dark:text-green-200 drop-shadow-lg">
            Welcome to Vertical Farm Manager
          </h1>
          <p className="text-lg sm:text-xl text-center text-gray-700 dark:text-gray-200 max-w-md">
            Design, manage, and optimize your vertical farm layouts with beautiful drag-and-drop tools and real-time feedback.
          </p>
          <Link href="/dashboard/layout">
            <button className="btn-animated bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all">
              Go to Dashboard
            </button>
          </Link>
        </div>
      </main>
      <footer className="w-full flex flex-col items-center gap-2 py-6 mt-8 text-gray-600 dark:text-gray-200 text-sm bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-4">
          <a href="https://github.com/your-org/vertical-farm" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
          <a href="/docs" className="footer-link">Docs</a>
          <a href="/about" className="footer-link">About</a>
        </div>
        <div className="font-medium">© {new Date().getFullYear()} Vertical Farm Manager. All rights reserved.</div>
      </footer>
    </div>
  );
}
