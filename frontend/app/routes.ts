import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),

    ...prefix("tasks", [
        layout("./routes/tasks/layout.tsx", [
            index("./routes/tasks/taskList.tsx"),
            route("add", "./routes/tasks/taskAdd.tsx"),
            route(":taskId/edit", "./routes/tasks/taskEdit.tsx"),
            route(":taskId/delete", "./routes/tasks/taskDelete.tsx"),
        ])
    ]),

    layout("./routes/auth/layout.tsx", [
        route("/auth/login", "./routes/auth/login.tsx"),
        route("/auth/signup", "./routes/auth/signup.tsx"),
    ]),
] satisfies RouteConfig;
