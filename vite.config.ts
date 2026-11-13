import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

const vercelInsights = `
<script>
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
</script>
<script defer src="/_vercel/insights/script.js"></script>
<script>
  window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
</script>
<script defer src="/_vercel/speed-insights/script.js"></script>
`;

function formPartial(): Plugin {
  return {
    name: "panelbay-form",
    transformIndexHtml(html) {
      const form = readFileSync(resolve(root, "src/partials/form.html"), "utf8");
      return html
        .replaceAll("<!--form-->", form.trim())
        .replace("</body>", `${vercelInsights}</body>`);
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
        privacy: resolve(root, "privacy/index.html"),
        contact: resolve(root, "contact/index.html"),
        closeboard: resolve(root, "closeboard/index.html"),
        cost: resolve(root, "fence-cost/index.html"),
      },
    },
  },
});
