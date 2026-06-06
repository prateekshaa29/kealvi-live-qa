import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kealvi Live Q&A",
    short_name: "Kealvi",
    description: "Ask, upvote, and follow questions by interest",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6fb",
    theme_color: "#5b54e8",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
