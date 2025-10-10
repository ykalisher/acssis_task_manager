import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    port: 3000,        //change the dev server port
    host: true,        //allow external access (needed in Docker)
    watch: {
      usePolling: true,     //force file polling
      interval: 100,        // optional, check every 100ms
    },
  },
});
