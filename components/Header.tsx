// components/Header.tsx
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    router.push("/login");
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="bg-cyan-100 border-b border-cyan-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-cyan-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <span className="ml-3 text-xl font-bold">Medmind Data</span>
          </div>
          

        </div>
        
        <div className="flex space-x-6 pb-0">
          <Link
            href="/dashboard"
            className={`px-6 py-3 border-b-2 transition ${
              isActive("/dashboard")
                ? "text-cyan-600 border-cyan-600"
                : "text-gray-700 border-transparent hover:text-cyan-600 hover:border-cyan-600"
            }`}
          >
            Home
          </Link>
          
          <Link
            href="/medicine"
            className={`px-6 py-3 border-b-2 transition ${
              isActive("/medicine")
                ? "text-cyan-600 border-cyan-600"
                : "text-gray-700 border-transparent hover:text-cyan-600 hover:border-cyan-600"
            }`}
          >
            ข้อมูลยา
          </Link>
          
          <button
            onClick={handleLogout}
            className="px-6 py-3 text-gray-700 hover:text-red-600 border-b-2 border-transparent hover:border-red-600 transition"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}