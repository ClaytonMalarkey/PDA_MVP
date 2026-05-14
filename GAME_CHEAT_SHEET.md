# 🎮 SPACE OUT — Playable Game Cheat Sheet

## 🚀 Quick Start
1. Open http://localhost:5173
2. Log in with your account
3. Click **🎮 Play** in the navbar (or go to http://localhost:5173/play)
4. Use WASD to move, Space to shoot — you're playing!

---

## 🎯 Controls

| Key | Action |
|-----|--------|
| W / ↑ | Move Up |
| S / ↓ | Move Down |
| A / ← | Move Left |
| D / → | Move Right |
| Space / E | Shoot (auto-aims at nearest enemy) |
| B | Build Station (costs 3 💎) |
| M (hold) | Mine adjacent asteroids |
| P | Pause / Resume |
| I | Toggle Minimap |

---

## 🗺️ World Objects

| Icon | Name | What It Does |
|------|------|-------------|
| 🚀 | You | Your spaceship — keep it alive! |
| 🪨 | Asteroid | Blocks movement — go around it |
| 💎 | Crystal | Collect for +10 credits, used for building |
| ⛽ | Fuel Cell | Collect for +30 fuel |
| 👾 | Enemy | Chases you, attacks when adjacent. Kill for XP + credits |
| 👹 | Boss | 3x HP, 2x damage, 3x rewards. Glows red |
| 🌀 | Portal | Step on it for +100 XP, +50 credits |
| 🏗️ | Station | Built by you. Costs 3 💎. Gives +50 XP |

---

## ❤️ Survival Tips

### Fuel Management
- Fuel drains 1 per 2 seconds automatically
- Collect ⛽ fuel cells (green) to refill +30
- If fuel hits 0 = **GAME OVER**
- Level up increases max fuel by +10

### Health Management
- Enemies deal 5-15 damage per hit (bosses deal 10-30)
- Your defense reduces incoming damage
- Level up fully heals you and increases max HP by +10
- If HP hits 0 = **GAME OVER**

---

## ⚔️ Combat Guide

### Shooting
- Press Space or E to fire
- Bullets auto-aim at the nearest enemy within 12 tiles
- Each bullet does damage equal to your Attack stat
- Bullets travel through empty space, destroyed by asteroids

### Enemy Behavior
- Enemies chase you when within 15 tiles
- They move every 0.5 seconds
- They attack when adjacent (1 tile away)
- **Normal enemies** 👾: 30-70 HP, 5-15 damage
- **Bosses** 👹: 90-210 HP, 10-30 damage, 3x rewards

### Combat Strategy
- Kite enemies — shoot while moving backward
- Use asteroids as cover
- Kill enemies from range before they reach you
- Prioritize fuel cells if HP is fine but fuel is low
- Bosses are worth it — 3x XP and 3x credits

---

## 📈 Leveling System

| Level | XP Needed | Max HP | Attack | Defense | Max Fuel |
|-------|-----------|--------|--------|---------|----------|
| 1 | 100 | 100 | 15 | 5 | 100 |
| 2 | 200 | 110 | 18 | 6 | 110 |
| 3 | 300 | 120 | 21 | 7 | 120 |
| 4 | 400 | 130 | 24 | 8 | 130 |
| 5 | 500 | 140 | 27 | 9 | 140 |
| 10 | 1000 | 190 | 42 | 14 | 190 |

**XP Formula:** Need `Level × 100` XP to level up
**On Level Up:** Full HP heal, full fuel refill, +10 max HP, +3 attack, +1 defense, +10 max fuel

---

## 🏗️ Building

- Press **B** on an empty space tile to build a station
- Costs **3 💎 crystals**
- Gives **+50 XP** per station built
- Stations block enemy movement (use as walls!)
- **Pro tip:** Build a defensive perimeter around portals

---

## 💰 Economy

| Source | Credits | XP |
|--------|---------|-----|
| Crystal 💎 | +10 | — |
| Kill Normal 👾 | +5-25 | +20-50 |
| Kill Boss 👹 | +15-75 | +60-150 |
| Portal 🌀 | +50 | +100 |
| Build Station 🏗️ | — | +50 |

---

## 🏆 Scoring

Your final score is based on:
- **Level reached** — higher = better
- **Enemies killed** — shows combat skill
- **Crystals collected** — shows exploration
- **Credits earned** — total wealth
- **Structures built** — shows empire building

---

## 🧠 Pro Strategies

### Early Game (Level 1-3)
1. Move carefully, avoid enemies at first
2. Collect crystals and fuel near spawn
3. Kill isolated enemies for XP
4. Don't chase bosses until Level 3+

### Mid Game (Level 3-7)
1. Start hunting enemies actively
2. Build stations near portals for XP
3. Use stations as defensive walls
4. Explore further from spawn for more crystals

### Late Game (Level 7+)
1. Hunt bosses — you can tank their damage now
2. Build station networks across the map
3. Clear enemy clusters for massive XP
4. Explore the entire map

### Survival Priority
1. **Fuel** > **HP** > **Crystals** > **Enemies**
2. Always know where the nearest fuel cell is
3. Don't fight if fuel is below 20

---

## 🔗 Game Hub Integration

After playing, go back to the **Game Hub** (/game) to:
- Train skills (Coding, Business, Fitness, etc.)
- Buy income generators for passive earnings
- Upgrade your hub (Room → Apartment → Office → Facility → Space Station)
- Complete quests for bonus rewards
- Research the 1,000-node tech tree
- Join a civilization with other players

---

## 🌌 Full App Navigation

| URL | What |
|-----|------|
| /play | **THE GAME** — Space Explorer |
| /game | Game Hub — Skills, Income, Quests |
| /space | 3D Solar System View |
| /dashboard | Stats Overview |
| /tasks | Real-World Task List |
| /research | 1,000-Node Research Tree |
| /civilizations | Join/Create Civilizations |
| /empire/in-game | Empire Structures |
| /empire/real-world | Real-World Rewards |
| /leaderboard | Rankings |


---

## 🎨 Player Customization

Before each game, you choose:
- **Ship Name** — name your vessel (shown in HUD and game over)
- **Ship Color** — 6 ship styles:
  - Nebula Blue, Crimson Fire, Emerald Viper, Void Phantom, Solar Emperor, Ice Shard
- You can change your ship mid-game by pressing P (Pause) → Customize

---

## ⚡ Power-Ups

Power-ups spawn as glowing icons on the map. Walk over them to collect.

| Icon | Name | Effect | Duration |
|------|------|--------|----------|
| 🛡️ | Shield | Invincible — blocks all damage | 8 seconds |
| ⚡ | Rapid Fire | 2x fire rate | 10 seconds |
| 💨 | Speed Boost | 2x movement speed | 8 seconds |
| 🧲 | Magnet | Auto-collect crystals/fuel in 3-tile radius | 12 seconds |
| 💥 | Nuke | Instantly kills all enemies within 8 tiles | Instant |
| 💖 | Heal | Fully restores HP | Instant |

Active power-ups show in a bar below the HUD with countdown timers.

---

## ⛏️ Asteroid Mining

Hold **M** while adjacent to an asteroid (brown circle) to mine it.

- Mining progress bar appears above your ship
- Each mine attempt has a 15% chance to break the asteroid
- **Regular Ore** (80% drop): +5 credits, +10 XP
- **Rare Ore** (20% drop): +30 XP, tracked separately
- Mining is the only way to clear asteroid paths
- Ore and Rare Ore counts shown in your stats panel

---

## 🌍 AR Explorer Mode (NEW!)

Access via: **🌍 AR** in navbar or http://localhost:5173/ar-explore

### How It Works
- Uses your **real GPS location** and **device camera**
- Game objects spawn around your real-world position
- Walk to objects in real life to collect them (within 50m)

### Three View Modes
1. **📷 AR View** — Camera feed with objects overlaid based on compass bearing
2. **🗺️ Map** — Radar-style circular map showing objects around you
3. **📋 List** — Sorted list of all nearby objects with distance

### AR Objects
| Icon | Name | Rarity | Reward |
|------|------|--------|--------|
| 💎 | Space Crystal | Common | +15💰 +20XP |
| ⛽ | Fuel Cell | Common | +10💰 +10XP |
| 📦 | Supply Crate | Common | +25💰 +30XP |
| ⛏️ | Asteroid Fragment | Common | +20💰 +25XP |
| 👾 | Alien Scout | Uncommon | +30💰 +50XP (combat) |
| 🌀 | Warp Portal | Uncommon | +50💰 +100XP |
| ⚡ | Power Core | Uncommon | +40💰 +60XP |
| 👹 | Alien Commander | Rare | +100💰 +150XP (combat) |
| ✨ | Rare Mineral | Rare | +75💰 +80XP |
| 🛸 | Abandoned Station | Rare | +60💰 +100XP |

### AR Combat
- Enemies (👾 👹) require tapping ATTACK multiple times
- Each tap deals 25 damage
- Scouts have 50 HP, Commanders have 150 HP

### Tips
- Objects within 50m glow and bounce — walk to them!
- Use Map view to plan your walking route
- Hit Refresh to spawn new objects
- Sync button sends your AR earnings to the game hub
