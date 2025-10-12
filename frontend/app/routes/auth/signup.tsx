import type { Route } from "../+types/home";

export async function loader({
    params
}: Route.LoaderArgs) {
    return {};
}

export default function Component({
    loaderData
}: Route.ComponentProps) {
    return <h1>sign up component</h1>
}