import { serveDir } from "https://deno.land/std@0.202.0/http/file_server.ts";

Deno.serve((req: Request) => {
    const pathname = new URL(req.url).pathname;

    if (pathname === "/" || pathname.startsWith("/assets")) {
        return serveDir(req, {
            fsRoot: "public",
        });
    }

    if (pathname === "/trans") {
        return new Response(JSON.stringify({
            code: 200,
            data: {
                link: ""
            }
        }), {
            status: 200,
        });
    }

    return new Response("404: Not Found", {
        status: 404,
    });
});