import {
    getSession,
} from "../../sessions";
import type { Route } from "../+types/home";
import { redirect, useFetcher, useLoaderData } from "react-router";
// ---------------- TYPES ----------------
type Status = "todo" | "inprogress" | "done";
type Priority = "High" | "Medium" | "Low";
interface Task {
    id: string;
    title: string;
    description: string;
    status: Status;
    assignees: string[];
    priority: Priority;
    tags: string[];
    due_date: string;
}

export const action = async ({
    request,
}: Route.ActionArgs) => {
    const session = await getSession(
        request.headers.get("Cookie"),
    );
    if (!session.has("userId")) {
        // Redirect to the home page if they are already signed in.
        return redirect("/auth/login")
    }
    let formData = await request.formData();
    let data = formData.get("data")

    let task = JSON.parse(data as string) as Task
    console.log("task update ............")
    console.log(task)
    try {
        const res = await fetch(`${process.env.API_URL ?? ""}/api/tasks/${task.id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${(session?.data?.userId as unknown as any).token}`,
            },
            body: null,
            credentials: "include", // if you use cookies / sessions
        });
        if (!res.ok) {

            const err = await res.json().catch(() => ({}));
            return { ok: false, message: err.message || "Invalid credentials" };
        }

        const data = await res.json();
        return { ok: true, message: "complete" };
    } catch (err: any) {
        return { ok: false, message: err.message };
    }
}