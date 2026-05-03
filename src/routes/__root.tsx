import { createRootRoute, Outlet, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-display">404</h1>
        <p className="text-muted-foreground mt-2">Page not found</p>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Family Album" },
      { name: "description", content: "Family Photo Vault securely stores and shares family photos, accessible via a modern, cookie-based sign-in." },
      { property: "og:title", content: "Family Album" },
      { name: "twitter:title", content: "Family Album" },
      { property: "og:description", content: "Family Photo Vault securely stores and shares family photos, accessible via a modern, cookie-based sign-in." },
      { name: "twitter:description", content: "Family Photo Vault securely stores and shares family photos, accessible via a modern, cookie-based sign-in." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7212b481-0999-42f6-8587-e23f7cccb4a3/id-preview-8b89f4a0--bde13023-2c7d-4d6d-bec7-0ceeba1c5be1.lovable.app-1777776496704.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7212b481-0999-42f6-8587-e23f7cccb4a3/id-preview-8b89f4a0--bde13023-2c7d-4d6d-bec7-0ceeba1c5be1.lovable.app-1777776496704.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: () => (
    <>
      <Layout />
      <Toaster />
    </>
  ),
  notFoundComponent: NotFound,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('family-photos.theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
