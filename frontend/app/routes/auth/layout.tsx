import {
  isRouteErrorResponse,
  Link,
  Meta,
  Outlet,
  useLocation
} from "react-router";
import {
  getSession,
  destroySession,
} from "../../sessions";
import type { Route } from "../+types/home";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(
    request.headers.get("Cookie"),
  );
  if (session.has("userId")) {
    // Redirect to the home page if they are already signed in.
    return { user: session.get("userId") };
  }
  return {}
}

export default function Layout({ matches }: Route.ComponentProps) {
  
  let location = useLocation()
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between">
        <h1 className="text-xl font-semibold text-gray-700">Task Manager</h1>
        <nav className="space-x-4">
          { location.pathname.endsWith("/auth/login") ?
            <Link to="/auth/signup" className="text-blue-600 hover:underline">SignUp</Link>
            :
            <Link to="/auth/login" className="text-blue-600 hover:underline">Login</Link>
          }
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>
    </div>
  );
}
