# Space Out - Game Design Document
## Public Deindoctrination App

---

## 1. Unique Selling Point

A New Frontier in Empire Building: The Public Deindoctrination App uniquely blends the strategic depth of Adventure Capitalist mechanics with the creative freedom of Terraria, all set in an expansive 3D space environment. Unlike any game before, this title integrates the thrill of space exploration with real-world tasks, offering a grounded yet adventurous experience that challenges players to expand their empire both in the game and in reality.

"Space Out" is a groundbreaking app that gamifies real-world tasks, seamlessly blending productivity with gaming. Users build and expand their virtual space empires through an immersive 3D interface while completing real-life objectives that earn them both in-game rewards and tangible, real-world benefits.

### Core Inspirations
- **Augmented Reality** of Pokemon Go
- **Procedural world generation and base building** of Terraria
- **Idle nature and user interface** similar to Adventure Capitalist

---

## 2. Game Concept

A 3D space empire-building game that integrates real-world tasks with virtual gameplay. Players engage in everyday activities to earn in-game rewards, which they use to expand their influence throughout the solar system. The app is designed to be both educational and entertaining, promoting personal growth and collective ambition.

---

## 3. Game Mechanics

### 3.1 3D Space Interface
- **Environment:** Players navigate a 3D space environment as the backdrop for empire-building
- **Empire Building:** Each player's empire is unique, evolving based on real-world achievements and in-game progress
- **Customizable Elements:** Personalize empires with specialized resources, abilities, and structures

### 3.2 Real-World Integration
- **Gamified Tasks:** Real-world activities (exercise, learning, community involvement) reward players with in-game currency, resources, or items
- **Customization:** Users set their own goals aligned with personal growth and deindoctrination journeys

### 3.3 Empire Building
- **Resource Management:** Gather resources by mining asteroids, colonizing planets, and building space stations
- **Strategic Planning:** Requires careful planning, resource allocation, and collaboration with other players
- **Branching Paths:** Choose development paths (Military, Scientific, Economic) that influence empire progress

### 3.4 Collaboration and Community
- **Team-Based Challenges:** Collaborate on community-wide objectives, unlocking new areas, resources, or abilities
- **Social Interaction:** Trading, strategy sharing, and cooperative gameplay

---

## 4. Game Modes

### 4.1 Solo Mode
- Individual progress focused on personal growth and empire expansion
- Complete tasks and challenges at your own pace

### 4.2 Collaborative Mode
- Team play on large-scale objectives, pooling resources and efforts
- Community events tied to real-world milestones or space exploration narratives

---

## 5. Art and Animation

### 5.1 Visual Style
- Vibrant, futuristic 3D space environment with detailed celestial bodies and space structures
- Visually distinctive elements for different paths (Military, Scientific, Economic)

### 5.2 Animations
- Smooth animations for mining, construction, and space travel
- Fluid character animations for building, exploring, and interacting

---

## 6. User Interface

### 6.1 Main Menu
- **Options:** Solo Mode, Collaborative Mode, Settings, Shop
- **Customization:** Screen for personalizing player's empire and avatar

### 6.2 In-Game HUD
- **Resource Tracker:** Current inventory of resources and in-game currency
- **Task Completion Bar:** Progress on real-world tasks and in-game objectives
- **Collaboration Meter:** Progress toward team-based challenges and community milestones

---

## 7. Monetization Strategy

### 7.1 Revenue Streams
- **In-App Purchases:** Buy in-game currency, resources, or boosters
- **Real-World Transactions:** Percentage of real-world reward transactions supports development
- **Advertisements:** Optional ads provide in-game currency/rewards without disrupting experience

### 7.2 Ongoing Development
- Regular updates with new features, challenges, and content
- Community feedback integration

---

## 8. User Engagement

### 8.1 Gamification of Learning
- Skill development linked to in-game rewards
- Educational content about space exploration and personal development

### 8.2 Social Interaction
- Thriving online community for strategy sharing, resource trading, and collaboration

### 8.3 Event-Driven Progress
- Periodic events tied to real-world milestones keep the game dynamic

---

## 9. 10 Unique Selling Points

1. **Gamified Real-World Impact** - Blends gaming with real-life tasks, rewarding users both in-game and in reality
2. **Build Your Own Empire** - 3D interface inspired by Adventure Capitalist for creating space empires
3. **Collaborative Universe** - Players work together toward common goals while advancing personal objectives
4. **Specialized Resources** - Unique resources per player for personalized strategies
5. **Real-World Rewards** - Tangible rewards from completing real-world objectives
6. **Monetized Success** - Small developer cut of real-world rewards keeps app free and accessible
7. **Fast-Track Progress** - Flexible in-app purchases and ads for different player types
8. **Immersive 3D Interface** - Visually captivating 3D experience mirroring personal growth
9. **Ethical Monetization** - Balanced purchases and ads without pressure to spend
10. **Visionary Purpose** - Everyday tasks tied to seeding humanity's empire throughout the solar system

---

## 10. Technical Architecture (Unity/C#)

### 10.1 Project Setup
- **Unity Version:** Unity 2021.3 LTS or newer
- **Required Packages:** TextMeshPro (UI), Cinemachine (camera), Firebase/PlayFab (data & auth)
- **Scene Structure:** Main Menu, Player Empire, Gameplay States
- **Scripts Folder:** `Assets/Scripts/`

### 10.2 Core Systems

#### Player Management (`Assets/Scripts/Player.cs`)
- Singleton pattern for global access
- Tracks: playerName, level, experience, credits (in-game currency), realWorldPoints
- Methods: AddCredits(), AddExperience(), CheckLevelUp(), CompleteRealWorldTask()
- Leveling formula: `experience >= level * 100`
- Persists across scenes via `DontDestroyOnLoad`

#### Resource Management (`Assets/Scripts/ResourceManager.cs`)
- Singleton pattern
- Resource types: Minerals, Energy, Research Points
- Methods: AddMinerals(), AddEnergy(), AddResearchPoints(), SpendResources()
- SpendResources validates availability before deducting

#### 3D Space Navigation (`Assets/Scripts/CameraController.cs`)
- Uses Cinemachine FreeLook camera
- Right mouse button for rotation (Mouse X/Y axes)
- Mouse scroll wheel for zoom (FOV clamped 15-90)

#### UI Management (`Assets/Scripts/UIManager.cs`)
- Updates HUD every frame with player/resource data
- Displays: Credits, Minerals, Energy
- ShowNotification() for in-game alerts

#### Task Manager (`Assets/Scripts/TaskManager.cs`)
- CompleteTask(taskId) handles different task types
- Task types: "exercise" (100 pts), "learnSkill" (200 pts)
- Awards both real-world points and in-game resources (e.g., 50 minerals)

### 10.3 Monetization Systems

#### In-App Purchases (`Assets/Scripts/PurchaseManager.cs`)
- Unity IAP integration via IStoreListener
- Product: "100_credits" (Consumable)
- Flow: InitializePurchasing() → BuyCreditsPack() → OnPurchaseComplete()
- Awards 100 credits on successful purchase

#### Ads Integration (`Assets/Scripts/AdsManager.cs`)
- Unity Ads via IUnityAdsListener
- Rewarded video ads
- Awards 50 credits for watching a complete ad
- Graceful handling of ad not ready / errors

### 10.4 Multiplayer Systems

#### Multiplayer Manager (`Assets/Scripts/MultiplayerManager.cs`)
- Photon PUN integration
- Flow: ConnectToServer() → OnConnectedToMaster() → JoinRandomRoom() or CreateRoom()
- Room capacity: 10 players max
- Auto-loads "MultiplayerScene" on room join
- Handles player join notifications

### 10.5 Event System

#### Event Manager (`Assets/Scripts/EventManager.cs`)
- Singleton with delegate/event pattern
- OnGlobalEventTriggered event for game-wide notifications
- TriggerRealWorldEvent(eventId) maps real-world events to in-game triggers
- Example: "spaceMissionSuccess" triggers a global event

---

## 11. System Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    SPACE OUT APP                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Player   │  │ Resource │  │  Task Manager    │  │
│  │ Manager   │  │ Manager  │  │ (Real-World      │  │
│  │           │  │          │  │  Integration)    │  │
│  └─────┬────┘  └─────┬────┘  └────────┬─────────┘  │
│        │             │                │             │
│  ┌─────▼─────────────▼────────────────▼──────────┐  │
│  │              UI Manager (HUD)                 │  │
│  └───────────────────┬───────────────────────────┘  │
│                      │                              │
│  ┌───────────────────▼───────────────────────────┐  │
│  │          3D Space Interface                   │  │
│  │  ┌────────────┐  ┌────────────┐               │  │
│  │  │  Camera     │  │  Empire    │               │  │
│  │  │  Controller │  │  Builder   │               │  │
│  │  └────────────┘  └────────────┘               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Purchase │  │   Ads    │  │  Multiplayer     │  │
│  │ Manager  │  │ Manager  │  │  Manager         │  │
│  │ (IAP)    │  │ (Unity)  │  │  (Photon)        │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           Event Manager                      │   │
│  │  (Global Events + Real-World Events)         │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 12. Development Phases

### Phase 1: Foundation
- Player management system (singleton, persistence)
- Resource management (minerals, energy, research)
- Basic 3D space environment with camera controls
- Core UI/HUD

### Phase 2: Gameplay Core
- Empire building mechanics (structures, upgrades)
- Real-world task integration and reward system
- Branching paths (Military, Scientific, Economic)
- Solo mode gameplay loop

### Phase 3: Social & Multiplayer
- Photon multiplayer integration
- Team-based challenges
- Trading and social interaction
- Community events system

### Phase 4: Monetization & Polish
- Unity IAP integration
- Unity Ads (rewarded video)
- Event-driven progression system
- UI polish and animations

### Phase 5: AR & Advanced Features
- Augmented reality features (Pokemon Go style)
- Procedural world generation (Terraria style)
- Advanced idle mechanics (Adventure Capitalist style)
- Educational content unlocks

---

## 13. Key Data Models

| Entity | Fields |
|--------|--------|
| Player | playerName, level, experience, credits, realWorldPoints |
| Resources | minerals, energy, researchPoints |
| Task | taskId, type, rewardPoints, inGameReward |
| Empire | structures[], path (military/scientific/economic), level |
| Room | maxPlayers (10), players[], state |
| Event | eventId, type (global/realWorld), triggers |
| Purchase | productId, type (consumable), price |

---

## 14. Mapping to Current Web App

The current PDA web application serves as the foundation with these existing systems:

| GDD Feature | Current Web App Implementation |
|-------------|-------------------------------|
| Player Management | User model (XP, currency, rank, streaks) |
| Resource Management | Currency system, XP rewards |
| Empire Building | In-Game Empire (structures, upgrades, idle income) |
| Real-World Tasks | Task system with real rewards + virtual rewards |
| Task Categories | 10 categories (Spiritual, Creative, Fitness, etc.) |
| Leaderboard | Leaderboard system with rankings |
| Real-World Rewards | Real World Empire page showing tangible rewards |
| Admin Controls | Admin dashboard for task/category/user management |

### Future Unity Migration Path
The web app's backend (Node.js/MongoDB) can serve as the API layer for the Unity client, enabling:
- Same user accounts and progress
- Shared task completion and rewards
- Cross-platform empire data
- Unified leaderboard and multiplayer systems
