const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

// CommonJS config avoids Vite's temporary bundled config file on Windows.
module.exports = defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
