import { serveDir, serveFile } from "https://deno.land/std@0.202.0/http/file_server.ts";
import genPPT from "./trans.js";

Deno.serve({ port: 8080 }, async (req: Request) => {
    const pathname = new URL(req.url).pathname;

    if (pathname === "/" || pathname.startsWith("/assets")) {
        return serveDir(req, {
            fsRoot: "public",
        });
    }

    if (pathname === "/trans") {
        var bd = await req.json()
        var ppt = await genPPT(bd.url)
        const headers = new Headers()
        headers.set("Content-Type", "application/json")
        return new Response(JSON.stringify({
            link: encodeURIComponent(ppt.path.replace("/tmp/", "/download/"))
        }), {
            headers: headers
        })
    }

    if (pathname.endsWith(".pptx") && pathname.startsWith("/download")) {
        return serveFile(req, decodeURIComponent(pathname.replace("/download/", "/tmp/")))
    }

    return new Response("404: Not Found", {
        status: 404,
    });
});