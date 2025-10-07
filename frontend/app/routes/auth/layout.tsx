import {
  isRouteErrorResponse,
  Link,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "../+types/home";

export default function Layout({}:Route.ComponentProps) {
  return (
   <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between">
        <h1 className="text-xl font-semibold text-gray-700">Task Manager</h1>
        <nav className="space-x-4">
          <Link to="/" className="text-blue-600 hover:underline">Home</Link>
          <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>
    </div>
  );
}
