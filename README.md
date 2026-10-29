# Image Unblur image preflight MCP

A small local helper for preparing photos before using [Image Unblur](https://imageunblur.ai/). The official website performs AI enhancement; this server does **not** upload, process, or reconstruct image pixels.

The `check_image_metadata` tool checks a file's format, byte size, and dimensions against the site's published limits: JPG/PNG/WebP, 20 MB, 24 megapixels, and 64–16,384 pixels per side. `plan_enhancement` suggests a cautious Basic or Pro first pass from a blur description, with reminders to verify faces and text. `get_official_links` returns the official site, pricing, and contact pages.

For example, before trying to [unblur image online](https://imageunblur.ai/), check that a 1200×800 PNG is within the upload limits, then compare any result at full size. The site says Pro can redraw details; a sharper face or letter is not necessarily a more accurate one. Do not use enhancement to claim recovery of intentionally obscured information.

## Run

Node.js 20.18.1 or newer:

```sh
npm install
npm test
node index.mjs
```

Configure an MCP client to start `node /absolute/path/to/imageunblur-mcp/index.mjs` over stdio. No API key or image upload is involved. Limits may change; check the official site before sending a file. MIT license; see `LICENSE`.
