const { createClient } = require('@supabase/supabase-js');

async function keepSupabaseAlive() {
  try {
    // 从环境变量读取配置
    const supabaseConfigStr = process.env.SUPABASE_CONFIG;

    if (!supabaseConfigStr) {
      console.error('Error: SUPABASE_CONFIG environment variable not set');
      return;
    }

    let supabaseConfigs;
    try {
      supabaseConfigs = JSON.parse(supabaseConfigStr);
    } catch (error) {
      console.error('Error parsing SUPABASE_CONFIG:', error.message);
      return;
    }

    // 遍历所有Supabase配置并执行查询
    for (const config of supabaseConfigs) {
      console.log(`Processing: ${config.name}`);

      // 创建Supabase客户端
      const supabase = createClient(config.supabase_url, config.supabase_key);

      try {
        // 执行一个简单的查询来保持数据库活跃
        // 这里查询表的行数，这是一个轻量级操作
        const { count, error } = await supabase
          .from(config.table_name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error(`Error querying ${config.name}:`, error.message);
        } else {
          console.log(`Successfully queried ${config.table_name}, table has ${count} rows`);
        }
      } catch (error) {
        console.error(`Error connecting to ${config.name}:`, error.message);
      }
    }

    console.log('Supabase keep-alive check completed');
  } catch (error) {
    console.error('Unexpected error in keepSupabaseAlive:', error.message);
  }
}

// 执行函数
keepSupabaseAlive()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });