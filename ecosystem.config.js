// ============================================================
//  PM2 — إبقاء التطبيق يعمل وإعادة تشغيله تلقائياً
//  التثبيت:  npm install -g pm2
//  التشغيل:  pm2 start ecosystem.config.js
//  الإقلاع مع النظام:  pm2 startup && pm2 save
// ============================================================
module.exports = {
  apps: [{
    name: 'khudh-biyadi',
    script: 'server/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
    env: { NODE_ENV: 'production' },
  }],
};
