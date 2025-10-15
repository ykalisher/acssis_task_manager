import type { Route } from "../+types/home";
import { useFetcher, redirect } from "react-router";
import {
    getSession,
    commitSession,
} from "../../sessions";

export async function loader({ request, params }: Route.LoaderArgs) {
    const session = await getSession(
        request.headers.get("Cookie"),
    );
    if (session.has("userId")) {
        // Redirect to the home page if they are already signed in.
        return redirect("/");
    }
    return {};
}

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(
        request.headers.get("Cookie"),
    );
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    try {
        const res = await fetch(`${process.env.API_URL ?? ""}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include", // if you use cookies / sessions
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            session.flash("error", err.message);
            await commitSession(session)
            return { ok: false, message: err.message || "Invalid credentials" };
        }

        const data = await res.json();
        
        session.set("userId", { ...data.user, token: data.token })
        return redirect("/", {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        });
    } catch (err: any) {
        return { ok: false, message: err.message };
    }
}

export default function LoginPage({ loaderData }: Route.ComponentProps) {
    const fetcher = useFetcher();
    const success = fetcher.data?.ok;
    const error = fetcher.data?.message;

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                Login
            </h2>

            <fetcher.Form method="post" className="space-y-5">
                <div>
                    <label className="block text-gray-600 mb-1" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-600 mb-1" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && (
                    <p className="text-green-600 text-sm text-center">
                        Logged in successfully!
                    </p>
                )}

                <button
                    type="submit"
                    disabled={fetcher.state !== "idle"}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                >
                    {fetcher.state === "submitting" ? "Signing in..." : "Sign In"}
                </button>
            </fetcher.Form>

            <p className="text-center text-sm text-gray-500 mt-4">
                Don’t have an account?{" "}
                <a href="/signup" className="text-blue-600 hover:underline">
                    Sign up
                </a>
            </p>
        </div>
    );
}
