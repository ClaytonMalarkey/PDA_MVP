#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const GameConfig = require('../models/GameConfig');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await GameConfig.deleteMany({});

  const configs = [
    // Menu visibility
    { configKey:'menu_quests', value:true, category:'menus', description:'Show Quests button in toolbar' },
    { configKey:'menu_tasks', value:true, category:'menus', description:'Show Tasks button in toolbar' },
    { configKey:'menu_empire', value:true, category:'menus', description:'Show Empire button in toolbar' },
    { configKey:'menu_research', value:true, category:'menus', description:'Show Research/Lore button' },
    { configKey:'menu_skills', value:true, category:'menus', description:'Show Skills/Train button' },
    { configKey:'menu_shop', value:true, category:'menus', description:'Show Shop/Market button' },
    { configKey:'menu_jobs', value:true, category:'menus', description:'Show Jobs button' },
    { configKey:'menu_battle', value:true, category:'menus', description:'Show Battle/Tactics button' },
    { configKey:'menu_ranks', value:true, category:'menus', description:'Show Ranks/Leaderboard button' },
    { configKey:'menu_social', value:true, category:'menus', description:'Show Social/Guild button' },
    { configKey:'menu_ar', value:true, category:'menus', description:'Show AR Explorer button' },
    { configKey:'menu_space', value:true, category:'menus', description:'Show 3D Space button' },
    { configKey:'menu_profile', value:true, category:'menus', description:'Show Profile/Hero button' },

    // Game settings
    { configKey:'game_title', value:'Space Out', category:'game', description:'Game title shown on customization screen' },
    { configKey:'game_subtitle', value:'Forge your destiny among the stars', category:'game', description:'Subtitle on customization screen' },
    { configKey:'starting_hp', value:100, category:'game', description:'Starting HP for new players' },
    { configKey:'starting_fuel', value:100, category:'game', description:'Starting fuel for new players' },
    { configKey:'starting_credits', value:0, category:'game', description:'Starting credits for new players' },
    { configKey:'fuel_drain_rate', value:2500, category:'game', description:'Fuel drain interval in ms' },
    { configKey:'enemy_count', value:65, category:'game', description:'Number of enemies per world' },
    { configKey:'crystal_count', value:90, category:'game', description:'Number of crystals per world' },
    { configKey:'powerup_count', value:20, category:'game', description:'Number of powerups per world' },

    // Economy
    { configKey:'xp_multiplier', value:1.0, category:'economy', description:'Global XP multiplier (1.0 = normal)' },
    { configKey:'currency_multiplier', value:1.0, category:'economy', description:'Global currency multiplier' },
    { configKey:'loot_box_cost', value:100, category:'economy', description:'Cost of a loot box in credits' },
    { configKey:'ad_reward_cooldown', value:300, category:'economy', description:'Ad reward cooldown in seconds' },
    { configKey:'streak_bonus_enabled', value:true, category:'economy', description:'Enable streak bonus multiplier' },
    { configKey:'combo_bonus_enabled', value:true, category:'economy', description:'Enable combo multiplier' },

    // Features
    { configKey:'ai_verification_enabled', value:true, category:'features', description:'Enable AI task verification' },
    { configKey:'ar_mode_enabled', value:true, category:'features', description:'Enable AR Explorer mode' },
    { configKey:'tactics_battle_enabled', value:true, category:'features', description:'Enable tactics battle system' },
    { configKey:'job_system_enabled', value:true, category:'features', description:'Enable job/class system' },
    { configKey:'social_chat_enabled', value:true, category:'features', description:'Enable global chat' },
    { configKey:'loot_box_enabled', value:true, category:'features', description:'Enable loot box system' },
    { configKey:'daily_login_enabled', value:true, category:'features', description:'Enable daily login rewards' },

    // Display
    { configKey:'show_minimap', value:true, category:'display', description:'Show minimap by default' },
    { configKey:'show_log', value:true, category:'display', description:'Show game log overlay' },
    { configKey:'show_stats_overlay', value:true, category:'display', description:'Show HP/Fuel/XP overlay' },

    // Background
    { configKey:'bg_color_1', value:'#0a3d1f', category:'background', description:'Background gradient color 1 (top)' },
    { configKey:'bg_color_2', value:'#1a6b35', category:'background', description:'Background gradient color 2' },
    { configKey:'bg_color_3', value:'#28a04d', category:'background', description:'Background gradient color 3 (middle)' },
    { configKey:'bg_color_4', value:'#1e8040', category:'background', description:'Background gradient color 4' },
    { configKey:'bg_color_5', value:'#156030', category:'background', description:'Background gradient color 5' },
    { configKey:'bg_color_6', value:'#0d4020', category:'background', description:'Background gradient color 6 (bottom)' },
    { configKey:'bg_sparkles', value:true, category:'background', description:'Show floating sparkle particles' },
    { configKey:'bg_light_rays', value:true, category:'background', description:'Show animated light rays' },
    { configKey:'bg_grass_blades', value:true, category:'background', description:'Show swaying grass blades' },
    { configKey:'bg_grid_lines', value:true, category:'background', description:'Show subtle grid lines' },
  ];

  await GameConfig.insertMany(configs);
  console.log('Seeded ' + configs.length + ' game configs');
  await mongoose.connection.close();
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
