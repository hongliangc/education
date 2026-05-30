// 魔法学习王国 — PM2 进程配置（生产，参考 roadmap B2）
// 用法：pm2 start deploy/ecosystem.config.js && pm2 save && pm2 startup
// 更新：git pull && npm ci && npx prisma migrate deploy && npm run build && pm2 reload mlk

module.exports = {
  apps: [
    {
      name: "mlk",
      cwd: "/var/www/mlk", // ← 改成服务器上的项目路径
      script: "npm",
      args: "start", // 即 next start（监听 3000）
      instances: 1, // 2核4G Lighthouse 用 1 个；内存富裕可改 "max"
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      max_memory_restart: "600M",
      autorestart: true,
    },

    // 预留：每日学习摘要定时任务（roadmap B6，scripts/daily-summary 待实现）
    // {
    //   name: "mlk-daily-summary",
    //   cwd: "/var/www/mlk",
    //   script: "node",
    //   args: "scripts/daily-summary.js",
    //   cron_restart: "0 20 * * *",
    //   autorestart: false,
    // },
  ],
};
