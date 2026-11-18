const { defineConfig } = require('@playwright/test');
module.exports=defineConfig({testDir:'./tests/browser',testMatch:'*.spec.js',workers:1,timeout:30000,
  use:{baseURL:'http://127.0.0.1:5175',headless:true,trace:'retain-on-failure'},
  webServer:[
    {command:'node tests/browser/server.js',url:'http://127.0.0.1:3001/api/health',reuseExistingServer:false},
    {command:'npm --prefix client run dev -- --port 5175',url:'http://127.0.0.1:5175',reuseExistingServer:false,
      env:{VITE_SUPABASE_URL:'https://cutoff-test.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'local-test-publishable-key',VITE_API_URL:'',API_PROXY_TARGET:'http://127.0.0.1:3001'}}
  ]});
