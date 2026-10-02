import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

function formPartial(): Plugin {
  return {
    name: "panelbay-form",
    transformIndexHtml(html) {
      const form = readFileSync(resolve(root, "src/partials/form.html"), "utf8");
      return html.replaceAll("<!--form-->", form.trim());
    },
  };
}

export default defineConfig({
  plugins: [formPartial()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        posts: resolve(root, "posts/index.html"),
        postcrete: resolve(root, "postcrete/index.html"),
        boards: resolve(root, "gravel-boards/index.html"),
        height: resolve(root, "height/index.html"),
      },
    },
  },
});
