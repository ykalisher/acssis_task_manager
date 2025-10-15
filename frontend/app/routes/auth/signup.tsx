import type { Route } from "../+types/home";
import { useFetcher, redirect } from "react-router";
import {
    getSession,
    commitSession,
} from "../../sessions";
// optional loader (can be empty)
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

// the action handles the form submission
export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    if (!name || !email || !password || !confirmPassword) {
        return { ok: false, message: "All fields are required.", status: 400 };
    }

    if (password !== confirmPassword) {
        return { ok: false, message: "Passwords do not match.", status: 400 };
    }
    try {
        const res = await fetch(`${process.env.API_URL ?? ""}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.log(err)
            return { ok: false, message: err.error || "Signup failed" };
        }

        return { ok: true };
    } catch (err: any) {
        return { ok: false, message: err.message };
    }
}

export default function SignupPage({ loaderData }: Route.ComponentProps) {
    const fetcher = useFetcher();
    const success = fetcher.data?.ok;
    const error = fetcher.data?.message;

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                Create Account
            </h2>

            <fetcher.Form method="post" className="space-y-5">
                <div>
                    <label className="block text-gray-600 mb-1" htmlFor="name">
                        Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Your name"
                        required
                    />
                </div>

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

                <div>
                    <label className="block text-gray-600 mb-1" htmlFor="confirmPassword">
                        Confirm Password
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && (
                    <p className="text-green-600 text-sm text-center">
                        Account created successfully!
                    </p>
                )}

                <button
                    type="submit"
                    disabled={fetcher.state !== "idle"}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                >
                    {fetcher.state === "submitting" ? "Creating..." : "Sign Up"}
                </button>
            </fetcher.Form>

            <p className="text-center text-sm text-gray-500 mt-4">
                Already have an account?{" "}
                <a href="/auth/login" className="text-blue-600 hover:underline">
                    Sign in
                </a>
            </p>
        </div>
    );
}
