import {
  isRouteErrorResponse,
  Link,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "../+types/home";

export default function Layout({}:Route.ComponentProps) {
  return (
   <div className="h-dvh bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between h-1/10">
        <h1 className="text-xl font-semibold text-gray-700">Task Manager</h1>
        <nav className="space-x-4">
          <Link to="/auth/logout" className="text-blue-600 hover:underline">Logout</Link>
        </nav>
      </header>

      <main className="flex items-center justify-center p-6 h-9/10">
        <Outlet />
      </main>
    </div>
  );
}
