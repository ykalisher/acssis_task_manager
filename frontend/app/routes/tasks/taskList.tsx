import type { Route } from "../+types/home";
import React, { useState, useMemo, type SyntheticEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateTaskForm } from "./taskCreateComponent";
import {
    Search,
    PlusCircle,
    X
} from "lucide-react";
import { redirect, useFetcher, useLoaderData } from "react-router";
import {
    getSession,
} from "../../sessions";


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

const STATUS_COLUMNS = [
    { key: "todo", title: "To Do" },
    { key: "inprogress", title: "In Progress" },
    { key: "done", title: "Done" },
] as const;

// ---------------- SAMPLE DATA ----------------
let SAMPLE_TASKS: Task[] = [
    {
        id: "t1",
        title: "Design onboarding flow",
        description: "Create wireframes & flows for new users",
        status: "todo",
        assignees: ["AL"],
        priority: "High",
        tags: ["UX", "Frontend"],
        due_date: "2025-10-03",
    },
    {
        id: "t2",
        title: "API: unify purchase payload",
        description: "Normalize transactions from both providers",
        status: "inprogress",
        assignees: ["YB"],
        priority: "Medium",
        tags: ["Backend", "Payments"],
        due_date: "2025-10-07",
    },
    {
        id: "t3",
        title: "Investigate spike in failures",
        description: "Check logs and metrics",
        status: "todo",
        assignees: [],
        priority: "High",
        tags: ["SRE"],
        due_date: "2025-09-30",
    },
    {
        id: "t4",
        title: "Integrate ML model",
        description: "Deploy model into inference pipeline",
        status: "done",
        assignees: ["AL", "YB"],
        priority: "Low",
        tags: ["ML"],
        due_date: "2025-09-20",
    },
];

export const loader = async ({
    request,
    params
}: Route.LoaderArgs) => {
    const session = await getSession(
        request.headers.get("Cookie"),
    );
    if (!session.has("userId")) {
        // Redirect to the home page if they are already signed in.
        return redirect("/auth/login")
    }
    try {
        const res = await fetch(`${process.env.API_URL ?? ""}/api/tasks`, {
            method: "GET",
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

        const data = await res.json() as Task[];
        console.log(data)
        data.map((task: Task) => {
            task.tags = JSON.parse(task.tags as unknown as string);
            return task;
        })
        return { tasks: data };
    } catch (err: any) {
        return { ok: false, message: err.message };
    }
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
    console.log(task)
    try {
        const res = await fetch(`${process.env.API_URL ?? ""}/api/tasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${(session?.data?.userId as unknown as any).token}`,
            },
            body: JSON.stringify({ title: task.title, description: task.description, priority: task.priority, due_date: task.due_date, tags: JSON.stringify(task.tags), status: task.status }),
            credentials: "include", // if you use cookies / sessions
        });
        if (!res.ok) {

            const err = await res.json().catch(() => ({}));
            session.flash("error", err.message);
        }

        const data = await res.json();
        console.log(data)
        return { ok: true, message: "complete" };
    } catch (err: any) {
        return { ok: false, message: err.message };
    }
}


// ---------------- HELPERS ----------------
function useFilteredTasks(
    tasks: Task[],
    query: string,
    tagFilter: string[],
    assigneeFilter: string[]
): Task[] {
    return useMemo(() => {
        const q = (query || "").toLowerCase().trim();
        return tasks.filter((t) => {
            if (q) {
                const hay = (
                    t.title +
                    " " +
                    t.description +
                    " " +
                    (t.tags || []).join(" ")
                ).toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (tagFilter.length && !tagFilter.every((tag) => t.tags.includes(tag))) {
                return false;
            }
            if (
                assigneeFilter.length &&
                !assigneeFilter.every((a) => t.assignees.includes(a))
            ) {
                return false;
            }
            return true;
        });
    }, [tasks, query, tagFilter, assigneeFilter]);
}

function Avatar({ initials }: { initials: string }) {
    return (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
            {initials}
        </div>
    );
}

function PriorityPill({ priority }: { priority: Priority }) {
    const map: Record<Priority, string> = {
        High: "bg-red-100 text-red-800",
        Medium: "bg-yellow-100 text-yellow-800",
        Low: "bg-green-100 text-green-800",
    };
    return (
        <span
            className={`text-xs px-2 py-0.5 rounded-full ${map[priority] || "bg-gray-100 text-gray-800"
                }`}
        >
            {priority}
        </span>
    );
}

// ---------------- MAIN COMPONENT ----------------
export default function TasksList({ loaderData }: Route.ComponentProps) {
    const { tasks } = useLoaderData<typeof loader>();
    const fetcher = useFetcher()
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [query, setQuery] = useState("");
    const [isModalOpen, setModalOpen] = useState(false);
    const [tagFilter, setTagFilter] = useState<string[]>([]);
    const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    console.log("here are tasks")
    console.log(tasks)
    const filtered = useFilteredTasks(tasks ? tasks : [], query, tagFilter, assigneeFilter);

    function onDragStart(e: MouseEvent | TouchEvent | PointerEvent, id: string) {
        setDraggingId(id)
    }

    function onDrop(e: React.DragEvent, status: Status) {
        const id = draggingId
        let ts = tasks?.find((t: Task) => t.id == id)
        ts ? ts.status = status : ts
        fetcher.submit(
            { data: JSON.stringify(ts) },
            { action: "/tasks/update", method: "post" }
        )
    }

    function onCreateTask(payload: Omit<Task, "id">) {
        fetcher.submit(
            { data: JSON.stringify({ ...payload }) },
            { method: "post", action: "/tasks" },
        )
        setModalOpen(false);
    }

    function onDeleteTask(payload: Task) {
        fetcher.submit(
            { data: JSON.stringify({ ...payload }) },
            { method: "post", action: "/tasks/delete" },
        )
        setSelectedTask(null)
    }

    function uniqueTags(): string[] {
        const s = new Set<string>();
        tasks?.forEach((t: any) => (t.tags || []).forEach((tag: any) => s.add(tag)));
        return Array.from(s);
    }

    const tags = uniqueTags();

    return (
        <div className="bg-gray-50 p-2 h-full">

            <div className="flex items-center justify-between mb-4 h-16">
                <div className="flex items-center gap-3 w-full">
                    <div className="relative flex-1">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search tasks, tags, descriptions..."
                            className="w-full border rounded-xl py-2 px-3 pl-10 bg-white"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <Search size={16} />
                        </div>
                    </div>

                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow hover:opacity-95"
                    >
                        <PlusCircle size={16} /> Create
                    </button>
                </div>
            </div>
            <div className="mb-3 h-16">
                <label className="text-xs">Tags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() =>
                                setTagFilter((prev) =>
                                    prev.includes(tag)
                                        ? prev.filter((t) => t !== tag)
                                        : [...prev, tag]
                                )
                            }
                            className={`text-xs px-2 py-1 rounded-full border ${tagFilter.includes(tag)
                                ? "bg-indigo-50 border-indigo-200"
                                : "bg-white"
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 flex justify-between max-w-7xl mx-auto h-[calc(100%-theme('spacing.32'))] pb-4">
                {/* Main Board */}


                <div className="grid grid-cols-4 gap-4 h-full">
                    {STATUS_COLUMNS.map((col) => (
                        <div
                            key={col.key}
                            className="pb-4 min-h-12 max-h-full"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => onDrop(e, col.key)}
                        >
                            <div className="flex items-center justify-between mb-2 bg-white rounded-2xl p-3 shadow-sm mb-4">
                                <h3 className="text-sm font-semibold">{col.title}</h3>
                                <span className="text-xs text-gray-500">
                                    {filtered.filter((t) => t.status === col.key).length}
                                </span>
                            </div>

                            <div
                                className="min-h-16
                                     h-fit max-h-[calc(100%-theme('spacing.12'))] overflow-auto"
                            >
                                <AnimatePresence>
                                    {filtered
                                        .filter((t) => t.status === col.key)
                                        .map((task) => (
                                            <motion.div
                                                key={task.id}
                                                layout
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="p-3 mb-3 bg-gray-50 rounded-lg border cursor-grab"
                                                draggable
                                                onDragStart={(e) => onDragStart(e, task.id)}
                                                onClick={() => setSelectedTask(task)}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-medium">
                                                                {task.title}
                                                            </h4>
                                                            <PriorityPill priority={task.priority} />
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {task.description}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="flex items-center gap-1">
                                                            {(task.assignees || []).map((a) => (
                                                                <Avatar key={a} initials={a} />
                                                            ))}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {task.due_date}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex gap-2 flex-wrap">
                                                    {(task.tags || []).map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="text-xs px-2 py-0.5 rounded-full bg-white border"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}

                    {/* Details Panel */}
                    <aside className="flex flex-col bg-white rounded-2xl p-4 shadow-sm overflow-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Details</h3>
                            <div className="text-sm text-gray-500">
                                Tip: click a card
                            </div>
                        </div>

                        {selectedTask ? (
                            <div>
                                <h4 className="text-md font-bold">{selectedTask.title}</h4>
                                <p className="text-sm text-gray-700 mt-2">
                                    {selectedTask.description}
                                </p>

                                <div className="mt-4">
                                    <div className="text-xs text-gray-500">Priority</div>
                                    <PriorityPill priority={selectedTask.priority} />
                                </div>

                                <div className="mt-3">
                                    <div className="text-xs text-gray-500">Assignees</div>
                                    <div className="flex gap-2 mt-2">
                                        {(selectedTask.assignees || []).map((a) => (
                                            <Avatar key={a} initials={a} />
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <div className="text-xs text-gray-500">Tags</div>
                                    <div className="flex gap-2 mt-2">
                                        {(selectedTask.tags || []).map((t) => (
                                            <span
                                                key={t}
                                                className="text-xs px-2 py-1 rounded-full bg-gray-100"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-3 text-xs text-gray-500">Due</div>
                                <div className="mt-1">{selectedTask.due_date}</div>

                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => onDeleteTask(selectedTask)}
                                        className="px-3 py-2 rounded-md border text-sm"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">
                                Select a task to see details. You can also create a task using the
                                Create button.
                            </div>
                        )}
                    </aside>

                </div>
            </div>


            {/* Create Task Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-[520px] bg-white rounded-2xl p-6 shadow-lg"
                        >
                            <CreateTaskForm
                                onCancel={() => setModalOpen(false)}
                                onCreate={onCreateTask}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

