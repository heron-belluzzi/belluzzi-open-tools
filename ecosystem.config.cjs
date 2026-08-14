module.exports = {
  apps: [
    {
      name: "belluzzi-open-tools",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      time: true,
      env: {
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: process.env.APP_PORT || "3020",
      },
    },
  ],
};
