import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Project Cinema" },
    {
      name: "description",
      content: "Demo cinema app for Vives by Simon Stijnen",
    },
  ];
}

export default function Home() {
  return <>Project Cinema</>;
}
