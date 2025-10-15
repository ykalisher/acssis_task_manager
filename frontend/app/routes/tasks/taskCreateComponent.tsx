import type { Route } from "../+types/home";
import React, { useState, useMemo, type SyntheticEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    PlusCircle,
    Trash,
    X
} from "lucide-react";

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

export function CreateTaskForm({
    onCancel,
    onCreate,
}: {
    onCancel: () => void;
    onCreate: (task: Omit<Task, "id">) => void;
}) {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [priority, setPriority] = useState<Priority>("Medium");
    const [tags, setTags] = useState("");
    const [due_date, setDue_date] = useState("");

    function submit() {
        if (!title.trim()) return;
        onCreate({
            title,
            description: desc,
            status: "todo",
            assignees: [],
            priority,
            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            due_date,
        });
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create task</h3>
                <button onClick={onCancel} className="text-gray-500">
                    <X className="size-6 hover:text-black" />
                </button>
            </div>

            <div className="flex flex-col space-y-3">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full border rounded-lg px-3 py-2"
                />
                <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Description"
                    className="w-full border rounded-lg px-3 py-2 h-24"
                />

                <div className="flex grid grid-cols-4 gap-2">
                    <div className="flex flex-col col-span-2 row-1">
                        <label htmlFor="priority">Priority</label>
                        <select
                            name="priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as Priority)}
                            className="border rounded-lg px-3 py-2 h-10"
                        >
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                        </select>
                    </div>
                    <input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="tags (comma separated)"
                        className="flex-1 border rounded-lg px-3 py-2 col-span-4 row-2"
                    />
                    <div className="flex flex-col col-span-2 row-1">
                        <label htmlFor="date">Date</label>
                        <input
                            name="date"
                            value={due_date}
                            onChange={(e) => setDue_date(e.target.value)}
                            type="date"
                            className="border rounded-lg px-3 py-2 h-10"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={submit}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow hover:opacity-95"
                    >
                        <PlusCircle size={16} /> Create
                    </button>
                </div>
            </div>
        </div>
    )
}