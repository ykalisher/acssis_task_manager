import {
    getSession,
    destroySession,
} from "../../sessions";
import type { Route } from "../+types/home";
import { redirect } from "react-router";

export async function loader({ request, params }: Route.LoaderArgs) {
    const session = await getSession(
        request.headers.get("Cookie"),
    );
    if (session.has("userId")) {
        // Redirect to the home page if they are already signed in.
        return redirect("/auth/login", {
            headers: {
                "Set-Cookie": await destroySession(session),
            },
        });
    }
    return redirect("/auth/login");
}
