# System Architecture — Public Deindoctrination App

## Unified Data Flow

```
USER LOGIN
    │
    ▼
┌─────────────────────────────────────────────────┐
│              GAME (PlayGame.jsx)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Canvas   │  │ HUD      │  │ Bottom       │  │
│  │ (2D game)│  │ (overlay)│  │ Toolbar      │  │
│  └────┬─────┘  └──────────┘  └──────┬───────┘  │
│       │                              │          │
│       ▼                              ▼          │
│  Procedural World          In-Game Panels       │
│  (infinite chunks)         (13 panels)          │
└─────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────────────┐
│              BACKEND API (Node.js)               │
│                                                  │
│  /api/auth          → JWT authentication         │
│  /api/gen-tasks     → Procedural task engine     │
│  /api/tasks         → Static task CRUD           │
│  /api/gameplay      → Skills, hub, generators    │
│  /api/empire        → Structures, idle income    │
│  /api/research      → 1000-node tech tree        │
│  /api/jobs          → 1200 job/class system      │
│  /api/shop          → In-app purchases           │
│  /api/social        → Chat, friends, challenges  │
│  /api/civilizations → Alliances/guilds           │
│  /api/leaderboard   → Rankings                   │
│  /api/game-config   → Admin-controlled settings  │
│  /api/categories    → Task categories            │
│  /api/user          → Profile, stats             │
│  /api/admin         → Admin management           │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              MONGODB DATABASE                    │
│                                                  │
│  Users, Tasks, UserTasks, Structures,            │
│  UserStructures, Transactions, Categories,       │
│  Civilizations, ResearchNodes, ResearchProgress, │
│  Quests, UserQuests, IncomeGenerators,           │
│  UserGenerators, ShopItems, Purchases,           │
│  Friends, Chats, Activities, Challenges,         │
│  Gifts, Achievements, UserAchievements,          │
│  DailyLogins, GameConfigs, UIConfigs             │
└─────────────────────────────────────────────────┘
```

## System Interaction Map

```
TASK COMPLETION FLOW:
  User selects task → Writes proof → AI Verifier scores →
  XP Service calculates rewards (streak × combo × global × AI bonus) →
  User model updated → Transaction logged → Activity feed posted →
  Achievement check → Milestone check → Level-up check

ECONOMY FLOW:
  Tasks/Mining/Kills → Credits earned →
  Spend on: Structures, Research, Shop, Generators, Loot Boxes →
  Structures → Idle income → More credits (compound loop)

PROGRESSION FLOW:
  XP → Level up → Unlock higher tasks/jobs/research →
  Research → Global multiplier increase →
  Jobs → Abilities → Better task performance →
  Hub upgrades → More automation slots → Passive income

SOCIAL FLOW:
  Chat → Friends → Challenges (wagers) →
  Alliances → Shared research bonuses →
  Leaderboard → Competition → Retention
```

## Services & Their Responsibilities

| Service | Input | Output | Dependencies |
|---------|-------|--------|-------------|
| taskGenerator | seed number | Task object | None (pure) |
| aiVerifier | task + proof + metadata | score, verified, multiplier | None (pure) |
| xpService | task + user | XP amount, rank | None (pure) |
| jobSystem | familyId, tier, spec | Job object | None (pure) |
| engagementEngine | user activity time | combo/streak multiplier | None (pure) |
| taskHelper | category | steps, tips, resources | None (pure) |
| gameplayController | user actions | game state changes | User, Generator models |
| empireController | purchase/upgrade | structure changes | User, Structure models |
| researchController | start/complete | research progress | User, ResearchNode models |
| shopController | buy/ad-reward | currency changes | User, ShopItem, Purchase models |
| socialController | chat/friend/gift | social interactions | User, Social models |

## Data Models (19 collections)

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| User | email, xp, rank, currency, skills, hub, streak | → UserTasks, UserStructures, Civilization |
| Task | taskId, title, category, xpReward, currencyReward | → UserTasks |
| UserTask | userId, taskId, status, xpAwarded | User ← → Task |
| Structure | structureId, baseCost, baseProduction | → UserStructures |
| UserStructure | userId, structureId, level | User ← → Structure |
| Transaction | userId, type, amount, currency | → User |
| Category | name, icon, color, isActive | → Tasks |
| Civilization | name, leaderId, members, governance | → Users |
| ResearchNode | nodeId, domain, tier, cost, dependencies | → ResearchProgress |
| ResearchProgress | userId, nodeId, isCompleted | User ← → ResearchNode |
| Quest | questId, type, requirements, rewards | → UserQuests |
| IncomeGenerator | generatorId, baseIncome, requiredSkill | → UserGenerators |
| ShopItem | itemId, priceUSD, priceCurrency, rewards | → Purchases |
| Purchase | userId, itemId, paymentMethod | User ← → ShopItem |
| Friend | userId, friendId, status | User ← → User |
| Chat | senderId, message | → User |
| Activity | userId, type, message | → User |
| Challenge | challengerId, targetId, type, wager | User ← → User |
| GameConfig | configKey, value, category | Admin controlled |

## Frontend Architecture

```
PlayGame.jsx (ENTRY POINT — the entire app)
  ├── Customization Screen (ship selection)
  ├── Game Canvas (infinite procedural world)
  │   ├── Background renderer (green gradient + effects)
  │   ├── Tile renderer (rocks, crystals, fuel, portals, structures)
  │   ├── Enemy renderer (9 types with AI)
  │   ├── Player renderer (12 ship colors)
  │   ├── Bullet/particle system
  │   └── Minimap overlay
  ├── HUD (top bar: stats, resources, controls)
  ├── Bottom Toolbar (13 panels)
  │   ├── MissionsPanel (random tasks, quick complete)
  │   ├── TasksPanel (browse all 30K tasks, AI verify, search)
  │   ├── EmpirePanel (structures, idle income)
  │   ├── ResearchPanel (10 domains, 1000 nodes)
  │   ├── SkillsPanel (6 skills, hub upgrade)
  │   ├── ShopPanel (purchases, ad rewards)
  │   ├── JobsPanel (20 families, 1200 jobs)
  │   ├── TacticsPanel (turn-based grid combat)
  │   ├── LeaderboardPanel (global rankings)
  │   ├── SocialPanel (chat, friends, gifts, challenges, loot)
  │   ├── ARPanel (GPS + real-world collection)
  │   ├── SpacePanel (solar system view)
  │   └── ProfilePanel (stats, logout)
  ├── Build Menu (6 buildable structures)
  ├── Pause Overlay
  ├── Game Over Screen
  └── Mobile Touch Controls
```

## Admin Dashboard

```
Admin Dashboard (port 5174)
  ├── Dashboard (overview stats)
  ├── Tasks (CRUD for static tasks)
  ├── Categories (manage task categories)
  ├── Users (manage users, roles)
  ├── Empire (view structures)
  ├── Leaderboard (view rankings)
  ├── Verifications (review submissions)
  ├── Metrics (analytics)
  ├── UI Config (theme settings)
  └── Game Config (48 settings across 6 categories)
      ├── Menu Visibility (13 toggles)
      ├── Game Settings (HP, fuel, counts)
      ├── Economy (multipliers, costs)
      ├── Features (toggle systems)
      ├── Display (overlays)
      └── Background (colors, effects)
```

## Reward Multiplier Stack

```
Final XP = Base XP
  × Streak Multiplier (1.0 – 2.0)
  × Combo Multiplier (1.0 – 1.5)
  × Global Multiplier (from research, starts at 1.0)
  × AI Verification Bonus (1.0 – 1.5)
  × Premium Bonus (1.0 or 1.5)
```

## Counts

- 30,000 procedurally generated tasks
- 1,200 jobs (20 families × 6 tiers × 10 specs)
- 1,000 research nodes (10 domains × 10 tiers × 10 nodes)
- 12 power-up types
- 9 enemy types
- 4 mineable rock types → 12 resources
- 6 buildable structures
- 12 ship customizations
- 48 admin-configurable settings
- 28 achievements
- 12 quests (daily/weekly/epic)
- 10 income generators
- 15 shop items
