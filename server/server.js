// server.js

const http = require("http");
const path = require("path");
const fs = require("fs");
const mime = require("mime");
const ws = require("ws");
const chokidar = require("chokidar");

////////////////////
// Project Constants
////////////////////

// Path to the files we want to serve
const ROOT = path.resolve("./src");

// Port to run the HTTP server on.
const PORT = 3000;

// Port to run the websockets server on.
const WS_PORT = 3001;

////////////////////
// HTTP Server
////////////////////

const assetsServer = http.createServer(async (request, response) => {
    if (request.method !== 'GET') {
        const responseBody = `Forbidden Method: ${request.method}`;

        response.writeHead(403, {
        "Content-Type": "plain/text",
        "Content-Length": Buffer.byteLength(responseBody),
        });

        return response.end(responseBody);
    }

      // Special Case: GET '/client.js'
    if (request.url === "/client.js") {
        const responseBody = await fs.promises.readFile("./server/client.js");

        response.writeHead(200, {
        "Content-Length": responseBody.length,
        "Content-Type": "application/javascript",
        });

        return response.end(responseBody);
    }
    const url = new URL(request.url, `http://${request.headers.host}`);
    let pathname = url.pathname;

    // If the pathname ends with '/', append 'index.html'.
    if (pathname.endsWith("/")) {
        console.log(pathname)
        pathname += "index.html";
    }

    try {
        const resourcePath = path.join(ROOT, pathname);
        let responseBody = await fs.promises.readFile(resourcePath);

        // HTML Files: Inject a <script> tag before </body>
        if (resourcePath.endsWith(".html")) {
            responseBody = responseBody
                .toString()
                .replace("</body>", '<script src="client.js"></script></body>');
            
            responseBody = Buffer.from(responseBody);
        }
        response.writeHead(200, {
        "Content-Type": mime.getType(resourcePath),
        "Content-Length": responseBody.length,
        });

        return response.end(responseBody);
    } catch (e) {
        // Respond to all errors with a 404 response.
        const responseBody = `Cannot GET resource: ${pathname}`;

        response.writeHead(404, {
        "Content-Type": "plain/text",
        "Content-Length": Buffer.byteLength(responseBody),
        });

        return response.end(responseBody);
    }
});

////////////////////
// HTTP Server
////////////////////

const reloadServer = new ws.WebSocketServer({
    port: WS_PORT
});

reloadServer.on("listening", () => {
    console.log(`Web sockets server is running on port ${WS_PORT}`);
});

reloadServer.on("reload", () => {
    reloadServer.clients.forEach((client) => {
      client.send("RELOAD");
    });
  });

assetsServer.listen(PORT, () => {
	console.log(`Assets Server is running on port: ${PORT}`);
});

chokidar.watch(ROOT + "/**/*.*").on("all", () => {
    reloadServer.emit("reload");
});