import type { Route } from "../+types/home";
import { useState } from "react";
export async function loader({
    params
}: Route.LoaderArgs) {
    return {};
}

export default function LoginPage({
    loaderData
}: Route.ComponentProps) {



    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Logging in with:", { email, password });
        // TODO: call your API or auth service
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-gray-600 mb-1" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-600 mb-1" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Sign In
                </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
                Don’t have an account?{" "}
                <a href="#" className="text-blue-600 hover:underline">
                    Sign up
                </a>
            </p>
        </div>
    );
}
