import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),

    ...prefix("tasks", [
        layout("./routes/tasks/layout.tsx", [
            index("./routes/tasks/taskList.tsx"),
            route("update", "./routes/tasks/taskUpdate.ts"),
            route("delete", "./routes/tasks/taskDelete.ts"),
        ])
    ]),

    layout("./routes/auth/layout.tsx", [
        route("/auth/login", "./routes/auth/login.tsx"),
        route("/auth/signup", "./routes/auth/signup.tsx"),
        route("/auth/logout", "./routes/auth/logout.tsx"),
    ]),
] satisfies RouteConfig;
