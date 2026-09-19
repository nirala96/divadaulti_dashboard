import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Diva Daulti Order Management",
    short_name: "Diva Daulti",
    description: "Production status, orders, and performance dashboard for Diva Daulti",
    // Not "/" - the dashboard is behind a login cookie, and Android's real
    // "Install app" flow needs Google's WebAPK service to fetch start_url
    // with no cookies at all to verify and package the app. "/" 307s to
    // /login for that anonymous fetch, which silently broke installation.
    // /login itself always returns 200, and an already-logged-in visitor
    // gets bounced straight through to the dashboard by the middleware.
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#111827",
    theme_color: "#111827",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
