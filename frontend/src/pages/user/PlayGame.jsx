import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import * as SFX from '../../utils/SoundEngine';
import { io as socketIO } from 'socket.io-client';
import { MissionsPanel, EmpirePanel, ResearchPanel, SkillsPanel, ShopPanel, LeaderboardPanel, ProfilePanel, TasksPanel, SocialPanel, JobsPanel, TacticsPanel, ARPanel, SpacePanel, AvatarPanel, ProjectsPanel, GuildsPanel, NodesPanel, PluginsPanel, ActivityFeedPanel } from '../../components/game/InGamePanels';
import NPCCompanion from '../../components/game/NPCCompanion';

// === CONSTANTS ===
const TILE_BASE = 36, WW = 10000, WH = 10000; // Effectively infinite
const CHUNK = 16; // Chunk size in tiles
function getGameSize() {
  const w = window.innerWidth;
  const isMobile = w < 768;
  const TILE = isMobile ? 24 : TILE_BASE;
  const VX = Math.floor(w / TILE);
  const VY = Math.floor((window.innerHeight - (isMobile ? 110 : 100)) / TILE);
  return { TILE, VX: Math.max(10, VX), VY: Math.max(8, VY) };
}
const T = { SPACE:0, ROCK:1, CRYSTAL:2, STATION:3, ENEMY:4, PORTAL:5, FUEL:6, NEBULA:7, POWERUP:8,
  ICE_ROCK:9, GOLD_ROCK:10, DARK_ROCK:11, TURRET:12, SHIELD_GEN:13, MINE_BOT:14, REFINERY:15, WARP_PAD:16,
  // Diegetic buildings
  BLDG_MISSION:17, BLDG_SHOP:18, BLDG_JOBS:19, BLDG_RESEARCH:20, BLDG_GUILD:21, BLDG_SOCIAL:22,
  BLDG_EMPIRE:23, BLDG_ARENA:24, BLDG_PROFILE:25, BLDG_NODES:26 };

// Building definitions — in-world interactive structures
const BUILDINGS = {
  [T.BLDG_MISSION]: { name:'Mission Terminal', icon:'✅', panel:'missions', col:'#10b981', col2:'#065f46', desc:'Accept & complete missions' },
  [T.BLDG_SHOP]: { name:'Marketplace', icon:'🛒', panel:'shop', col:'#c9a84c', col2:'#92400e', desc:'Buy credits, items & premium' },
  [T.BLDG_JOBS]: { name:'Job Hall', icon:'⚔️', panel:'jobs', col:'#8b5cf6', col2:'#4c1d95', desc:'Find jobs & specializations' },
  [T.BLDG_RESEARCH]: { name:'Research Lab', icon:'🔬', panel:'research', col:'#3b82f6', col2:'#1e3a5f', desc:'Unlock research nodes' },
  [T.BLDG_GUILD]: { name:'Guild Hall', icon:'⚔️', panel:'guilds', col:'#f59e0b', col2:'#78350f', desc:'Join guilds & alliances' },
  [T.BLDG_SOCIAL]: { name:'Social Hub', icon:'🌐', panel:'social', col:'#06b6d4', col2:'#164e63', desc:'Chat, friends & challenges' },
  [T.BLDG_EMPIRE]: { name:'Empire Tower', icon:'🏛️', panel:'empire', col:'#6366f1', col2:'#312e81', desc:'Manage your empire' },
  [T.BLDG_ARENA]: { name:'Battle Arena', icon:'🎯', panel:'tactics', col:'#ef4444', col2:'#7f1d1d', desc:'PvP battles & tournaments' },
  [T.BLDG_PROFILE]: { name:'Identity Shrine', icon:'👤', panel:'identity', col:'#ec4899', col2:'#831843', desc:'Avatar & identity' },
  [T.BLDG_NODES]: { name:'Node Nexus', icon:'🖥️', panel:'nodes', col:'#14b8a6', col2:'#134e4a', desc:'Manage your node network' },
};

// Radial menu items — replaces the old bottom toolbar entirely
const RADIAL_ACTIONS = [
  { id:'missions', icon:'✅', label:'Quests', col:'#10b981' },
  { id:'tasks', icon:'📋', label:'Tasks', col:'#3b82f6' },
  { id:'empire', icon:'🏛️', label:'Empire', col:'#6366f1' },
  { id:'research', icon:'🔬', label:'Research', col:'#3b82f6' },
  { id:'skills', icon:'⚡', label:'Train', col:'#f59e0b' },
  { id:'shop', icon:'🛒', label:'Market', col:'#c9a84c' },
  { id:'jobs', icon:'⚔️', label:'Jobs', col:'#8b5cf6' },
  { id:'ranks', icon:'🏆', label:'Ranks', col:'#ecc94b' },
  { id:'social', icon:'🌐', label:'Social', col:'#06b6d4' },
  { id:'guilds', icon:'⚔️', label:'Guilds', col:'#f59e0b' },
  { id:'identity', icon:'👤', label:'Identity', col:'#ec4899' },
  { id:'nodes', icon:'🖥️', label:'Nodes', col:'#14b8a6' },
  { id:'plugins', icon:'🔌', label:'Plugins', col:'#a855f7' },
  { id:'feed', icon:'📡', label:'Feed', col:'#10b981' },
  { id:'profile', icon:'👤', label:'Profile', col:'#94a3b8' },
];

const SHIP_COLORS = [
  { id:'blue', name:'Nebula Blue', body:'#1d4ed8', cock:'#60a5fa', wing:'#1e40af', thrust:'#f59e0b' },
  { id:'red', name:'Crimson Fire', body:'#dc2626', cock:'#fca5a5', wing:'#991b1b', thrust:'#f97316' },
  { id:'green', name:'Emerald Viper', body:'#059669', cock:'#6ee7b7', wing:'#047857', thrust:'#22d3ee' },
  { id:'purple', name:'Void Phantom', body:'#7c3aed', cock:'#c4b5fd', wing:'#5b21b6', thrust:'#f472b6' },
  { id:'gold', name:'Solar Emperor', body:'#d97706', cock:'#fde68a', wing:'#92400e', thrust:'#ef4444' },
  { id:'cyan', name:'Ice Shard', body:'#0891b2', cock:'#a5f3fc', wing:'#155e75', thrust:'#a78bfa' },
  { id:'black', name:'Shadow Wraith', body:'#1f2937', cock:'#6b7280', wing:'#111827', thrust:'#a855f7' },
  { id:'pink', name:'Neon Blaze', body:'#db2777', cock:'#fbcfe8', wing:'#9d174d', thrust:'#fbbf24' },
  { id:'orange', name:'Inferno', body:'#ea580c', cock:'#fed7aa', wing:'#9a3412', thrust:'#22d3ee' },
  { id:'white', name:'Ghost Protocol', body:'#e5e7eb', cock:'#ffffff', wing:'#9ca3af', thrust:'#6366f1' },
  { id:'lime', name:'Toxic Venom', body:'#65a30d', cock:'#d9f99d', wing:'#3f6212', thrust:'#f43f5e' },
  { id:'steel', name:'Iron Fortress', body:'#475569', cock:'#94a3b8', wing:'#334155', thrust:'#f59e0b' },
];

const POWERUP_TYPES = [
  { id:'shield', icon:'🛡️', name:'Shield', dur:10, col:'#3b82f6', desc:'Invincible 10s' },
  { id:'rapid', icon:'⚡', name:'Rapid Fire', dur:12, col:'#f59e0b', desc:'3x fire rate' },
  { id:'speed', icon:'💨', name:'Speed Boost', dur:10, col:'#10b981', desc:'2x speed' },
  { id:'magnet', icon:'🧲', name:'Magnet', dur:15, col:'#8b5cf6', desc:'Auto-collect 4 tiles' },
  { id:'nuke', icon:'💥', name:'Nuke', dur:0, col:'#ef4444', desc:'Kill all in 10 tiles' },
  { id:'heal', icon:'💖', name:'Full Heal', dur:0, col:'#ec4899', desc:'Restore all HP' },
  { id:'double_xp', icon:'✨', name:'Double XP', dur:20, col:'#fbbf24', desc:'2x XP for 20s' },
  { id:'double_loot', icon:'💎', name:'Double Loot', dur:20, col:'#a855f7', desc:'2x credits 20s' },
  { id:'piercing', icon:'🔱', name:'Piercing Shot', dur:15, col:'#14b8a6', desc:'Bullets go through' },
  { id:'regen', icon:'💚', name:'Regen', dur:15, col:'#22c55e', desc:'Heal 3HP/sec' },
  { id:'freeze', icon:'❄️', name:'Freeze', dur:8, col:'#06b6d4', desc:'Freeze all enemies' },
  { id:'multi_shot', icon:'🌀', name:'Multi-Shot', dur:12, col:'#f97316', desc:'Shoot 3 directions' },
];

// Enemy types with different behaviors
const ENEMY_TYPES = [
  { id:'scout', icon:'👾', col:'#ef4444', hpMul:1, dmgMul:1, spdMul:1, xpMul:1, lootMul:1, behavior:'chase' },
  { id:'tank', icon:'🛡️', col:'#6366f1', hpMul:3, dmgMul:0.7, spdMul:0.5, xpMul:2, lootMul:1.5, behavior:'chase' },
  { id:'sniper', icon:'🎯', col:'#f59e0b', hpMul:0.8, dmgMul:2.5, spdMul:0.8, xpMul:1.5, lootMul:1.2, behavior:'ranged' },
  { id:'swarm', icon:'🐛', col:'#10b981', hpMul:0.4, dmgMul:0.5, spdMul:2, xpMul:0.5, lootMul:0.5, behavior:'swarm' },
  { id:'bomber', icon:'💣', col:'#f97316', hpMul:1.2, dmgMul:3, spdMul:0.6, xpMul:2, lootMul:2, behavior:'explode' },
  { id:'ghost', icon:'👻', col:'#a855f7', hpMul:0.6, dmgMul:1.5, spdMul:1.5, xpMul:1.8, lootMul:1.5, behavior:'teleport' },
  { id:'boss_dragon', icon:'🐉', col:'#dc2626', hpMul:8, dmgMul:3, spdMul:0.4, xpMul:10, lootMul:8, behavior:'boss' },
  { id:'boss_mech', icon:'🤖', col:'#3b82f6', hpMul:10, dmgMul:2, spdMul:0.3, xpMul:12, lootMul:10, behavior:'boss' },
  { id:'boss_void', icon:'🌑', col:'#1e1b4b', hpMul:6, dmgMul:4, spdMul:0.6, xpMul:15, lootMul:12, behavior:'boss' },
];

// Mineable rock types
const ROCK_TYPES = {
  [T.ROCK]: { name:'Stone', col1:'#5C3A1E', col2:'#8B5E3C', drops:[{item:'stone',w:70},{item:'iron',w:25},{item:'crystal',w:5}], hardness:3 },
  [T.ICE_ROCK]: { name:'Ice', col1:'#4A2E14', col2:'#7EC8E3', drops:[{item:'ice',w:50},{item:'water',w:30},{item:'diamond',w:20}], hardness:2 },
  [T.GOLD_ROCK]: { name:'Gold Vein', col1:'#4A3010', col2:'#DAA520', drops:[{item:'gold',w:60},{item:'platinum',w:30},{item:'artifact',w:10}], hardness:5 },
  [T.DARK_ROCK]: { name:'Dark Matter', col1:'#3D1F0A', col2:'#6B3FA0', drops:[{item:'dark_matter',w:40},{item:'void_crystal',w:35},{item:'singularity',w:25}], hardness:8 },
};

// Resources from mining
const RESOURCES = {
  stone:{name:'Stone',icon:'🪨',value:2},iron:{name:'Iron',icon:'⚙️',value:5},crystal:{name:'Crystal',icon:'💎',value:10},
  ice:{name:'Ice',icon:'🧊',value:3},water:{name:'Water',icon:'💧',value:4},diamond:{name:'Diamond',icon:'💠',value:25},
  gold:{name:'Gold',icon:'🥇',value:15},platinum:{name:'Platinum',icon:'⬜',value:30},artifact:{name:'Artifact',icon:'🏺',value:50},
  dark_matter:{name:'Dark Matter',icon:'🌑',value:40},void_crystal:{name:'Void Crystal',icon:'🔮',value:60},singularity:{name:'Singularity',icon:'⭕',value:100},
};

// Buildable structures
const BUILDABLE = [
  { id:'station', tile:T.STATION, name:'Station', icon:'🏗️', cost:{stone:3}, xp:50, desc:'Basic outpost' },
  { id:'turret', tile:T.TURRET, name:'Auto-Turret', icon:'🔫', cost:{iron:5,stone:3}, xp:80, desc:'Shoots nearby enemies automatically' },
  { id:'shield_gen', tile:T.SHIELD_GEN, name:'Shield Generator', icon:'🛡️', cost:{crystal:2,iron:3}, xp:100, desc:'Heals you when adjacent' },
  { id:'mine_bot', tile:T.MINE_BOT, name:'Mining Drone', icon:'⛏️', cost:{iron:5,gold:2}, xp:120, desc:'Auto-mines nearby rocks' },
  { id:'refinery', tile:T.REFINERY, name:'Refinery', icon:'🏭', cost:{iron:8,stone:5}, xp:150, desc:'Doubles resource value nearby' },
  { id:'warp_pad', tile:T.WARP_PAD, name:'Warp Pad', icon:'🌀', cost:{void_crystal:1,crystal:3}, xp:200, desc:'Teleport between pads' },
];

function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a;}

// === PROCEDURAL INFINITE WORLD ===
// Seeded hash for deterministic generation
function worldHash(x, y, seed) {
  var n = x * 374761393 + y * 668265263 + seed;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return (n >>> 0) / 4294967296;
}

// Get tile at any world coordinate (procedurally generated)
function getTileAt(x, y) {
  if (x < 0 || y < 0) return T.SPACE;

  // === CORE HUB ZONE (center of map, 5000±25) ===
  var hubCX = 5000, hubCY = 5000, hubR = 25;
  var dx = x - hubCX, dy = y - hubCY;
  var distSq = dx * dx + dy * dy;
  if (distSq <= hubR * hubR) {
    var dist = Math.sqrt(distSq);
    // Center beacon (ring at radius 2-3, not on spawn point)
    if (dist >= 2 && dist < 3.5 && (Math.abs(dx) < 1.5 || Math.abs(dy) < 1.5)) return T.PORTAL;

    // === DIEGETIC BUILDINGS (placed at fixed positions around hub) ===
    // North: Mission Terminal
    if (dx >= -1 && dx <= 1 && dy >= -9 && dy <= -7) return T.BLDG_MISSION;
    // NE: Marketplace
    if (dx >= 5 && dx <= 7 && dy >= -7 && dy <= -5) return T.BLDG_SHOP;
    // East: Job Hall
    if (dx >= 7 && dx <= 9 && dy >= -1 && dy <= 1) return T.BLDG_JOBS;
    // SE: Research Lab
    if (dx >= 5 && dx <= 7 && dy >= 5 && dy <= 7) return T.BLDG_RESEARCH;
    // South: Guild Hall
    if (dx >= -1 && dx <= 1 && dy >= 7 && dy <= 9) return T.BLDG_GUILD;
    // SW: Social Hub
    if (dx >= -7 && dx <= -5 && dy >= 5 && dy <= 7) return T.BLDG_SOCIAL;
    // West: Empire Tower
    if (dx >= -9 && dx <= -7 && dy >= -1 && dy <= 1) return T.BLDG_EMPIRE;
    // NW: Battle Arena
    if (dx >= -7 && dx <= -5 && dy >= -7 && dy <= -5) return T.BLDG_ARENA;
    // Inner NE: Identity Shrine
    if (dx >= 3 && dx <= 4 && dy >= -4 && dy <= -3) return T.BLDG_PROFILE;
    // Inner SW: Node Nexus
    if (dx >= -4 && dx <= -3 && dy >= 3 && dy <= 4) return T.BLDG_NODES;

    // Crystal ring at radius 12-14
    if (dist > 12 && dist < 14 && worldHash(x, y, 42) > 0.5) return T.CRYSTAL;
    // Fuel stations at radius 18-20
    if (dist > 18 && dist < 20 && worldHash(x, y, 137) > 0.6) return T.FUEL;
    // Hub border wall (only the very edge)
    if (dist > hubR - 1.5) return T.ROCK;
    return T.SPACE;
  }

  var h = worldHash(x, y, 42);
  var h2 = worldHash(x, y, 137);
  // Nebula patches (Perlin-like clusters)
  var nx = Math.sin(x * 0.15) * Math.cos(y * 0.12) * 0.5 + 0.5;
  if (nx > 0.7 && h > 0.6) return T.NEBULA;
  // Rocks (common ~6%)
  if (h < 0.06) return T.ROCK;
  // Ice rocks (clusters)
  if (h < 0.08 && Math.sin(x * 0.05 + y * 0.03) > 0.5) return T.ICE_ROCK;
  // Gold veins (rare)
  if (h < 0.085 && h2 > 0.8) return T.GOLD_ROCK;
  // Dark matter (very rare)
  if (h < 0.088 && h2 > 0.95) return T.DARK_ROCK;
  // ORDER MATTERS: check from highest to lowest
  // Portals (very rare ~0.5%)
  if (h > 0.995) return T.PORTAL;
  // Powerups (~0.7%)
  if (h > 0.988) return T.POWERUP;
  // Crystals (~1.5%)
  if (h > 0.973) return T.CRYSTAL;
  // Fuel (~1.5%)
  if (h > 0.958) return T.FUEL;
  // Enemies (3%)
  if (h > 0.928) return T.ENEMY;
  return T.SPACE;
}

// World is now a sparse map — only store modified tiles
var worldMods = {};
function getWorldTile(x, y) {
  var key = x + ',' + y;
  if (worldMods[key] !== undefined) return worldMods[key];
  return getTileAt(x, y);
}
function setWorldTile(x, y, tile) {
  worldMods[x + ',' + y] = tile;
}

function genWorld() { return []; } // No longer pre-generate — world is infinite

function genEnemies() {
  // Enemies are generated on-the-fly from getTileAt
  return [];
}

// Generate enemies visible in viewport
function getVisibleEnemies(cx, cy, vx, vy, existingEnemies) {
  var enemies = [];
  var existingById = {};
  existingEnemies.forEach(function(e) { existingById[e.id] = e; });

  for (var ty = -3; ty < vy + 3; ty++) {
    for (var tx = -3; tx < vx + 3; tx++) {
      var wx = cx + tx, wy = cy + ty;
      if (wx < 0 || wy < 0) continue;
      var id = wx + '-' + wy;

      // If we already track this enemy, keep it
      if (existingById[id]) {
        enemies.push(existingById[id]);
        delete existingById[id];
        continue;
      }

      // Check if this tile should have an enemy
      var tile = getTileAt(wx, wy); // Use original procedural, not modified
      var modTile = getWorldTile(wx, wy);
      if (tile === T.ENEMY && modTile !== T.SPACE) {
        var h = worldHash(wx, wy, 999);
        var r2 = worldHash(wx, wy, 777);
        var etIdx = Math.floor(h * ENEMY_TYPES.length);
        if (etIdx >= ENEMY_TYPES.length) etIdx = 0;
        var et = ENEMY_TYPES[etIdx];
        var baseHp = 30 + Math.floor(r2 * 40);
        var hp = Math.floor(baseHp * et.hpMul);
        enemies.push({id:id, x:wx, y:wy, hp:hp, maxHp:hp, dmg:Math.floor((6+r2*10)*et.dmgMul),
          xpR:Math.floor((20+r2*35)*et.xpMul), loot:Math.floor((8+r2*20)*et.lootMul),
          alive:true, boss:et.behavior==='boss', type:et, spdMul:et.spdMul});
      }
    }
  }
  // Keep enemies that moved but are still nearby
  Object.values(existingById).forEach(function(e) {
    if (e.alive && Math.abs(e.x - cx - vx/2) < vx && Math.abs(e.y - cy - vy/2) < vy) {
      enemies.push(e);
    }
  });
  return enemies;
}

// Get powerup type at a world coordinate (deterministic)
function getPowerupAt(x, y) {
  var h = worldHash(x, y, 555);
  var idx = Math.floor(h * POWERUP_TYPES.length);
  if (idx >= POWERUP_TYPES.length) idx = 0;
  return POWERUP_TYPES[idx];
}

function genPowerups() { return []; }

// === MAIN COMPONENT ===
export default function PlayGame(){
  const { logout } = useAuth();
  const nav = useNavigate();
  const cvs=useRef(null),miniC=useRef(null),keys=useRef({}),raf=useRef(null);
  const [gameSize,setGameSize]=useState(()=>getGameSize());
  const gameSizeRef=useRef(gameSize);
  useEffect(()=>{gameSizeRef.current=gameSize;},[gameSize]);
  useEffect(()=>{const h=()=>setGameSize(getGameSize());window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[]);
  const [phase,setPhase]=useState('customize'); // customize | playing | over
  const [shipColor,setShipColor]=useState(SHIP_COLORS[0]);
  const shipColorRef=useRef(shipColor);
  useEffect(()=>{shipColorRef.current=shipColor;},[shipColor]);
  const [shipName,setShipName]=useState('Explorer-1');
  const [world,setWorld]=useState([]);
  const [enemies,setEnemies]=useState([]);
  const [powerups,setPowerups]=useState([]);
  const spawnX=useRef(5000);
  const spawnY=useRef(5000);
  const [p,setP]=useState({x:spawnX.current,y:spawnY.current,hp:100,mhp:100,fuel:100,mfuel:100,atk:15,def:5,xp:0,lv:1,cry:0,cred:0,kills:0,structs:0,ore:0,rareOre:0,miningProg:0,
    inv:{stone:0,iron:0,crystal:0,ice:0,water:0,diamond:0,gold:0,platinum:0,artifact:0,dark_matter:0,void_crystal:0,singularity:0},
    turrets:[],mineBots:[],shieldGens:[],refineries:[],warpPads:[],totalMined:0,bossKills:0,powerupsCollected:0});
  const [bullets,setBullets]=useState([]);
  const [fx,setFx]=useState([]);
  const [msgs,setMsgs]=useState([]);
  const [paused,setPaused]=useState(false);
  const [showMini,setShowMini]=useState(true);
  const [score,setScore]=useState(0);
  const [time,setTime]=useState(0);
  const [activePowerups,setActivePowerups]=useState([]);
  const [mining,setMining]=useState(false);
  const [soundOn,setSoundOn]=useState(true);
  const [activePanel,setActivePanel]=useState(null);
  const [buildMenu,setBuildMenu]=useState(false);
  const [nearbyBuilding,setNearbyBuilding]=useState(null); // { tile, name, icon, panel, desc }
  const [showRadial,setShowRadial]=useState(false); // radial menu (replaces toolbar)
  const [selectedPlayer,setSelectedPlayer]=useState(null); // clicked other player
  const [gameConfig,setGameConfig]=useState({});
  const gameConfigRef=useRef({});
  useEffect(()=>{gameConfigRef.current=gameConfig;},[gameConfig]);
  useEffect(()=>{axios.get('/api/game-config/public').then(r=>setGameConfig(r.data||{})).catch(()=>{});},[]); // null|'missions'|'empire'|'research'|'skills'|'shop'|'ranks'|'alliance'

  // === MULTIPLAYER STATE ===
  const [otherPlayers,setOtherPlayers]=useState([]);
  const [worldEvents,setWorldEvents]=useState([]);
  const [onlineCount,setOnlineCount]=useState(0);
  const socketRef=useRef(null);
  const otherPlayersRef=useRef([]);
  useEffect(()=>{otherPlayersRef.current=otherPlayers;},[otherPlayers]);

  // Connect to WebSocket for multiplayer
  useEffect(()=>{
    const token=localStorage.getItem('token');
    if(!token)return;
    const sock=socketIO('http://localhost:5000',{auth:{token},transports:['websocket','polling']});
    socketRef.current=sock;
    sock.on('connect',()=>console.log('🔌 MMO connected'));
    sock.on('players:nearby',(players)=>setOtherPlayers(players));
    sock.on('player:moved',(data)=>{
      setOtherPlayers(prev=>{
        const idx=prev.findIndex(p=>p.userId===data.userId);
        if(idx>=0){const n=[...prev];n[idx]={...n[idx],...data};return n;}
        return[...prev,data];
      });
    });
    sock.on('player:left',(data)=>setOtherPlayers(prev=>prev.filter(p=>p.userId!==data.userId)));
    sock.on('world:event',(event)=>{setWorldEvents(prev=>[event,...prev].slice(0,5));});
    sock.on('world:tick',(data)=>{setOnlineCount(data.onlineUsers||0);if(data.activeEvents)setWorldEvents(data.activeEvents);});
    sock.on('presence',(data)=>setOnlineCount(data.count||0));
    // === IN-WORLD REWARD NOTIFICATION ===
    sock.on('reward:earned',(data)=>{
      msg(`${data.aiVerified?'🤖':'✅'} ${data.message||'Reward earned!'}`);
      if(data.rareDrops?.length>0) msg(`🎁 Rare drop: ${data.rareDrops[0].name||'Item'}!`);
    });
    // === ACTIVITY FEED — other players completing tasks ===
    sock.on('activity',(data)=>{
      if(data.type==='task_complete') msg(`👥 ${data.message}`);
    });
    // === SOCIAL INTERACTIONS ===
    sock.on('social:wave',(data)=>{
      msg(`${data.message||'Someone waved at you!'}`);
      SFX.playClick && SFX.playClick();
    });
    sock.on('social:challenge',(data)=>{
      msg(`${data.message||'Someone challenged you!'}`);
    });
    // === CIVILIZATION LEVEL UP ===
    sock.on('world:levelup',(data)=>{
      msg(`🏆 Civilization reached Level ${data.level}! All players contributed!`);
    });
    return()=>{sock.disconnect();socketRef.current=null;};
  },[]);

  // Send position to server every 500ms
  useEffect(()=>{
    if(phase!=='playing')return;
    const iv=setInterval(()=>{
      if(socketRef.current&&pR.current){
        socketRef.current.emit('player:move',{
          x:Math.round(pR.current.x),y:Math.round(pR.current.y),zone:'overworld',
          profile:{email:localStorage.getItem('userEmail')||'player',rank:1,status:'exploring',
            shipColor:shipColorRef.current?{body:shipColorRef.current.body,wing:shipColorRef.current.wing,cock:shipColorRef.current.cock,thrust:shipColorRef.current.thrust,name:shipColorRef.current.name}:null}
        });
      }
    },500);
    return()=>clearInterval(iv);
  },[phase]);

  const pR=useRef(p),wR=useRef(world),eR=useRef(enemies),bR=useRef(bullets),fxR=useRef(fx);
  const pauseR=useRef(paused),phaseR=useRef(phase),puR=useRef(powerups),apR=useRef(activePowerups),miningR=useRef(mining);
  useEffect(()=>{pR.current=p;},[p]);
  useEffect(()=>{wR.current=world;},[world]);
  useEffect(()=>{eR.current=enemies;},[enemies]);
  useEffect(()=>{bR.current=bullets;},[bullets]);
  useEffect(()=>{fxR.current=fx;},[fx]);
  useEffect(()=>{pauseR.current=paused;},[paused]);
  useEffect(()=>{phaseR.current=phase;},[phase]);
  useEffect(()=>{puR.current=powerups;},[powerups]);
  useEffect(()=>{apR.current=activePowerups;},[activePowerups]);
  useEffect(()=>{miningR.current=mining;},[mining]);

  const msg=useCallback((t)=>setMsgs(pr=>[...pr.slice(-6),{t,ts:Date.now()}]),[]);
  const hasPU=useCallback((id)=>apR.current.some(a=>a.id===id&&a.until>Date.now()),[]);

  const addFx=(x,y,col,n=8)=>{const{TILE}=gameSizeRef.current;const nf=[];for(let i=0;i<n;i++)nf.push({x:x*TILE+rand(0,TILE),y:y*TILE+rand(0,TILE),col,born:Date.now(),vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4});setFx(pr=>[...pr,...nf]);};

  function lvUp(np){const need=np.lv*100;if(np.xp>=need){np.lv++;np.xp-=need;np.mhp+=12;np.hp=np.mhp;np.atk+=3;np.def+=1;np.mfuel+=10;np.fuel=np.mfuel;msg(`🎉 LEVEL ${np.lv}! All stats up!`);SFX.playLevelUp();}}

  // Keyboard
  useEffect(()=>{
    const d=(e)=>{const tag=e.target.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||e.target.isContentEditable)return;keys.current[e.key.toLowerCase()]=true;if(e.key==='p')setPaused(v=>!v);if(e.key==='i')setShowMini(v=>!v);if(e.key==='e'||e.key==='E'){/* interact with building — handled in render */}if(e.key==='t'||e.key==='T'||e.key==='Tab'){e.preventDefault();setShowRadial(v=>!v);}if(phase==='playing')e.preventDefault();};
    const u=(e)=>{const tag=e.target.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||e.target.isContentEditable)return;keys.current[e.key.toLowerCase()]=false;};
    window.addEventListener('keydown',d);window.addEventListener('keyup',u);
    return()=>{window.removeEventListener('keydown',d);window.removeEventListener('keyup',u);};
  },[phase]);

  const shoot=useCallback(()=>{
    const pp=pR.current;let near=null,md=999;
    eR.current.filter(e=>e.alive).forEach(e=>{const d=Math.abs(e.x-pp.x)+Math.abs(e.y-pp.y);if(d<md&&d<14){md=d;near=e;}});
    let dx=1,dy=0;if(near){const ddx=near.x-pp.x,ddy=near.y-pp.y;dx=ddx===0?0:ddx/Math.abs(ddx);dy=ddy===0?0:ddy/Math.abs(ddy);}
    setBullets(pr=>[...pr,{x:pp.x,y:pp.y,dx,dy,life:20,dmg:pp.atk}]);
    SFX.playShoot();
  },[]);

  // === SPAWN ENEMIES & ITEMS ON GAME START ===
  useEffect(()=>{
    if(phase!=='playing')return;
    const pp=pR.current;
    // Spawn 40 enemies around player
    const newEnemies=[];
    for(let i=0;i<40;i++){
      const angle=Math.random()*Math.PI*2;
      const dist=8+Math.random()*30;
      const ex=Math.round(pp.x+Math.cos(angle)*dist);
      const ey=Math.round(pp.y+Math.sin(angle)*dist);
      const etIdx=Math.floor(Math.random()*ENEMY_TYPES.length);
      const et=ENEMY_TYPES[etIdx];
      const baseHp=30+Math.floor(Math.random()*40);
      const hp=Math.floor(baseHp*et.hpMul);
      newEnemies.push({id:'e'+i+'-'+ex+'-'+ey,x:ex,y:ey,hp:hp,maxHp:hp,
        dmg:Math.floor((6+Math.random()*10)*et.dmgMul),
        xpR:Math.floor((20+Math.random()*35)*et.xpMul),
        loot:Math.floor((8+Math.random()*20)*et.lootMul),
        alive:true,boss:et.behavior==='boss',type:et,spdMul:et.spdMul});
    }
    setEnemies(newEnemies);
    // Place crystals, fuel, portals, powerups around player
    for(let i=0;i<60;i++){
      const angle=Math.random()*Math.PI*2;
      const dist=5+Math.random()*35;
      const ix=Math.round(pp.x+Math.cos(angle)*dist);
      const iy=Math.round(pp.y+Math.sin(angle)*dist);
      const existing=getWorldTile(ix,iy);
      if(existing===T.SPACE||existing===T.NEBULA){
        if(i<20) setWorldTile(ix,iy,T.CRYSTAL);
        else if(i<35) setWorldTile(ix,iy,T.FUEL);
        else if(i<45) setWorldTile(ix,iy,T.POWERUP);
        else if(i<50) setWorldTile(ix,iy,T.PORTAL);
        else if(i<55) setWorldTile(ix,iy,T.ICE_ROCK);
        else setWorldTile(ix,iy,T.GOLD_ROCK);
      }
    }
    msg('⚔️ Enemies spotted! Crystals and fuel nearby.');
  },[phase]);

  // === GAME LOOP ===
  useEffect(()=>{
    if(phase!=='playing')return;
    let lm=0,le=0,lb=0,lf=0,lt=0,lShoot=0,lMine=0,lRespawn=0;
    const loop=(ts)=>{
      if(phaseR.current!=='playing'){draw();return;}
      raf.current=requestAnimationFrame(loop);
      if(pauseR.current){draw();return;}
      const pp=pR.current,k=keys.current;
      const hasSpeed=hasPU('speed'),hasRapid=hasPU('rapid'),hasShield=hasPU('shield'),hasMagnet=hasPU('magnet');
      const moveRate=hasSpeed?65:100;
      const shootRate=hasRapid?120:250;

      if(ts-lt>1000){setTime(t=>t+1);lt=ts;}

      // Expire powerups
      setActivePowerups(pr=>pr.filter(a=>a.until>Date.now()));

      // Move
      if(ts-lm>moveRate){
        // E key: interact with nearby building
        if(k['e']){k['e']=false;
          for(var edy=-2;edy<=2;edy++)for(var edx=-2;edx<=2;edx++){
            var et2=getWorldTile(pp.x+edx,pp.y+edy);
            if(BUILDINGS[et2]){setActivePanel(BUILDINGS[et2].panel);setPaused(true);break;}
          }
        }
        let nx=pp.x,ny=pp.y;
        if(k['w']||k['arrowup'])ny--;if(k['s']||k['arrowdown'])ny++;
        if(k['a']||k['arrowleft'])nx--;if(k['d']||k['arrowright'])nx++;
        if(nx>=0&&nx<WW&&ny>=0&&ny<WH&&(nx!==pp.x||ny!==pp.y)){
          const tile=getWorldTile(nx,ny);
          if(tile!==T.ROCK&&tile!==T.STATION&&tile!==T.ICE_ROCK&&tile!==T.GOLD_ROCK&&tile!==T.DARK_ROCK&&tile!==T.TURRET&&tile!==T.SHIELD_GEN&&tile!==T.MINE_BOT&&tile!==T.REFINERY&&!BUILDINGS[tile]){
            const np={...pp,x:nx,y:ny};
            if(tile===T.CRYSTAL){np.cry++;np.cred+=10;setWorldTile(nx,ny,T.SPACE);msg('💎 Crystal +10💰');addFx(nx,ny,'#a78bfa');SFX.playCrystal();}
            if(tile===T.FUEL){np.fuel=Math.min(np.fuel+30,np.mfuel);setWorldTile(nx,ny,T.SPACE);msg('⛽ +30 fuel');addFx(nx,ny,'#34d399');SFX.playFuel();}
            if(tile===T.PORTAL){np.xp+=100;np.cred+=50;msg('🌀 Portal! +100XP +50💰');addFx(nx,ny,'#fbbf24',15);lvUp(np);SFX.playPortal();
              // Contribute to world civilization
              if(socketRef.current) socketRef.current.emit('world:contribute',{type:'build',amount:10});
            }
            if(tile===T.POWERUP){
              const pu={type:getPowerupAt(nx,ny)};
              setWorldTile(nx,ny,T.SPACE);
                if(pu.type.id==='nuke'){
                  let nuked=0;
                  setEnemies(pe=>pe.map(e=>{if(e.alive&&Math.abs(e.x-nx)+Math.abs(e.y-ny)<8){nuked++;
                    setP(pp2=>{const np2={...pp2,xp:pp2.xp+e.xpR,cred:pp2.cred+e.loot,kills:pp2.kills+1};lvUp(np2);return np2;});
                    addFx(e.x,e.y,'#ff6b6b',15);setWorldTile(e.x,e.y,T.SPACE);
                    return{...e,hp:0,alive:false};}return e;}));
                  msg(`💥 NUKE! ${nuked} enemies destroyed!`);addFx(nx,ny,'#ef4444',25);SFX.playNuke();
                }else if(pu.type.id==='heal'){np.hp=np.mhp;msg('💖 Full HP restored!');addFx(nx,ny,'#ec4899',12);SFX.playPowerup();
                }else{setActivePowerups(pr=>[...pr,{id:pu.type.id,until:Date.now()+pu.type.dur*1000,type:pu.type}]);
                  msg(`${pu.type.icon} ${pu.type.name}! ${pu.type.desc}`);addFx(nx,ny,pu.type.col,12);SFX.playPowerup();}
            }
            // Magnet: auto-collect nearby crystals/fuel
            if(hasMagnet){
              for(let dy2=-3;dy2<=3;dy2++)for(let dx2=-3;dx2<=3;dx2++){
                const mx=np.x+dx2,my=np.y+dy2;
                if(mx>=0&&mx<WW&&my>=0&&my<WH){
                  const mt=getWorldTile(mx,my);
                  if(mt===T.CRYSTAL){np.cry++;np.cred+=10;setWorldTile(mx,my,T.SPACE);addFx(mx,my,'#a78bfa',4);}
                  if(mt===T.FUEL){np.fuel=Math.min(np.fuel+15,np.mfuel);setWorldTile(mx,my,T.SPACE);addFx(mx,my,'#34d399',4);}
                }}}
            setP(np);

            // === BUILDING PROXIMITY DETECTION ===
            var foundBldg = null;
            for(var bdy=-2;bdy<=2;bdy++)for(var bdx=-2;bdx<=2;bdx++){
              var bt=getWorldTile(np.x+bdx,np.y+bdy);
              if(BUILDINGS[bt]){foundBldg=BUILDINGS[bt];break;}
            }
            setNearbyBuilding(foundBldg);
          }
        }
        // Shoot
        if((k[' ']||k['e'])&&ts-lShoot>shootRate){shoot();lShoot=ts;}
        // Build
        // Build menu toggle
        if(k['b']){setBuildMenu(true);k['b']=false;}
        lm=ts;
      }

      // === MINING (hold M near any rock type) ===
      if(k['m']){
        setMining(true);
        if(ts-lMine>250){
          const pp2=pR.current;let mined=false;
          for(let dy=-1;dy<=1&&!mined;dy++)for(let dx=-1;dx<=1&&!mined;dx++){
            const mx=pp2.x+dx,my=pp2.y+dy;
            if(mx>=0&&mx<WW&&my>=0&&my<WH){
              const tile=getWorldTile(mx,my);
              const rockInfo=ROCK_TYPES[tile];
              if(rockInfo){
                const chance=0.12+(1/rockInfo.hardness)*0.08;
                if(Math.random()<chance){
                  setWorldTile(mx,my,T.SPACE);
                  // Roll drop table
                  const roll=Math.random()*100;let cumul=0;let drop='stone';
                  for(const d of rockInfo.drops){cumul+=d.w;if(roll<cumul){drop=d.item;break;}}
                  const res=RESOURCES[drop];
                  setP(pr=>({...pr,inv:{...pr.inv,[drop]:(pr.inv[drop]||0)+1},cred:pr.cred+res.value,xp:pr.xp+res.value*2,totalMined:pr.totalMined+1}));
                  msg(`${res.icon} ${res.name}! +${res.value}💰`);addFx(mx,my,rockInfo.col2,10);SFX.playMineSuccess();
                  mined=true;
                }else{setP(pr=>({...pr,miningProg:Math.min(pr.miningProg+15,100)}));addFx(mx,my,'#666',2);SFX.playMine();mined=true;}
              }}}
          if(!mined)setP(pr=>({...pr,miningProg:0}));
          lMine=ts;
        }
      }else{setMining(false);setP(pr=>({...pr,miningProg:0}));}

      // Bullets
      if(ts-lb>70){
        setBullets(pr=>{const next=[];pr.forEach(b=>{
          const nb={...b,x:b.x+b.dx,y:b.y+b.dy,life:b.life-1};
          if(nb.life<=0||nb.x<0||nb.x>=WW||nb.y<0||nb.y>=WH)return;
          if(getWorldTile(nb.x,nb.y)===T.ROCK||getWorldTile(nb.x,nb.y)===T.ICE_ROCK||getWorldTile(nb.x,nb.y)===T.GOLD_ROCK||getWorldTile(nb.x,nb.y)===T.DARK_ROCK){addFx(nb.x,nb.y,'#888',3);return;}
          let hit=false;
          setEnemies(pe=>pe.map(e=>{if(e.alive&&e.x===nb.x&&e.y===nb.y){hit=true;const nh=e.hp-nb.dmg;
            if(nh<=0){setP(pp=>{const np={...pp,xp:pp.xp+e.xpR,cred:pp.cred+e.loot,kills:pp.kills+1};lvUp(np);return np;});
              msg(`💀 ${e.boss?'BOSS':'Enemy'} killed! +${e.xpR}XP +${e.loot}💰`);addFx(e.x,e.y,e.boss?'#ff6b6b':'#f87171',e.boss?20:10);
              if(e.boss)SFX.playBossExplosion();else SFX.playExplosion();
              setWorldTile(e.x,e.y,T.SPACE);setScore(s=>s+e.xpR);
              return{...e,hp:0,alive:false};}addFx(e.x,e.y,'#fff',3);SFX.playHit();return{...e,hp:nh};}return e;}));
          if(!hit)next.push(nb);});return next;});lb=ts;}

      // Spawn enemies from procedural world into state
      if(ts-le>450){
        const{VX,VY}=gameSizeRef.current;
        const camX=pp.x-Math.floor(VX/2),camY=pp.y-Math.floor(VY/2);
        const visible=getVisibleEnemies(camX,camY,VX,VY,eR.current);
        setEnemies(visible);

        // Enemy AI movement
        setEnemies(pr=>pr.map(e=>{if(!e.alive)return e;
        const dx=pR.current.x-e.x,dy=pR.current.y-e.y,dist=Math.abs(dx)+Math.abs(dy);
        if(dist>16)return e;
        if(dist<=1){if(!hasPU('shield')){
          setP(pp=>{const dmg=Math.max(1,e.dmg-pp.def);const nh=pp.hp-dmg;if(nh<=0){setPhase('over');msg('💀 You died!');SFX.playDeath();}else{SFX.playDamage();}return{...pp,hp:Math.max(0,nh)};});}
          else{msg('🛡️ Shield blocked!');addFx(pR.current.x,pR.current.y,'#3b82f6',5);SFX.playHit();}return e;}
        let nx=e.x,ny=e.y;if(Math.abs(dx)>=Math.abs(dy))nx+=dx>0?1:-1;else ny+=dy>0?1:-1;
        if(nx>=0&&nx<WW&&ny>=0&&ny<WH){const t=getWorldTile(nx,ny);if(t===T.SPACE||t===T.FUEL||t===T.NEBULA)return{...e,x:nx,y:ny};}
        return e;}));le=ts;}

      // Fuel drain
      if(ts-lf>2500){setP(pp=>{const nf=pp.fuel-1;if(nf<=0){setPhase('over');msg('⛽ Out of fuel!');SFX.playDeath();return{...pp,fuel:0};}return{...pp,fuel:nf};});lf=ts;}

      // Respawn enemies and items every 20 seconds
      if(!lRespawn) lRespawn=ts;
      if(ts-lRespawn>20000){
        const pp3=pR.current;
        // Spawn 10 new enemies
        setEnemies(prev=>{
          const ne=[...prev.filter(e=>e.alive)];
          for(let i=0;i<10;i++){
            const a=Math.random()*Math.PI*2,d=15+Math.random()*25;
            const ex=Math.round(pp3.x+Math.cos(a)*d),ey=Math.round(pp3.y+Math.sin(a)*d);
            // Don't spawn enemies inside Core Hub
            const hdx=ex-5000,hdy=ey-5000;if(hdx*hdx+hdy*hdy<625)continue;
            const etIdx=Math.floor(Math.random()*ENEMY_TYPES.length);
            const et=ENEMY_TYPES[etIdx];const bh=30+Math.floor(Math.random()*40);const hp2=Math.floor(bh*et.hpMul);
            ne.push({id:'r'+Date.now()+'-'+i,x:ex,y:ey,hp:hp2,maxHp:hp2,dmg:Math.floor((6+Math.random()*10)*et.dmgMul),
              xpR:Math.floor((20+Math.random()*35)*et.xpMul),loot:Math.floor((8+Math.random()*20)*et.lootMul),
              alive:true,boss:et.behavior==='boss',type:et,spdMul:et.spdMul});
          }
          return ne;
        });
        // Spawn items
        for(let i=0;i<15;i++){
          const a=Math.random()*Math.PI*2,d=8+Math.random()*30;
          const ix=Math.round(pp3.x+Math.cos(a)*d),iy=Math.round(pp3.y+Math.sin(a)*d);
          if(getWorldTile(ix,iy)===T.SPACE){
            if(i<5) setWorldTile(ix,iy,T.CRYSTAL);
            else if(i<10) setWorldTile(ix,iy,T.FUEL);
            else if(i<13) setWorldTile(ix,iy,T.POWERUP);
            else setWorldTile(ix,iy,T.PORTAL);
          }
        }
        lRespawn=ts;
      }

      setFx(pr=>pr.filter(f=>Date.now()-f.born<700));
      draw();
    };
    raf.current=requestAnimationFrame(loop);
    return()=>{if(raf.current)cancelAnimationFrame(raf.current);};
  },[phase]);

  // === DRAW ===
  function draw(){
    const{TILE,VX,VY}=gameSizeRef.current;
    const c=cvs.current;if(!c)return;const ctx=c.getContext('2d');
    const W=c.width,H=c.height,pp=pR.current,sc=shipColor;
    const cx=Math.max(0,Math.min(pp.x-Math.floor(VX/2),WW-VX));
    const cy=Math.max(0,Math.min(pp.y-Math.floor(VY/2),WH-VY));
    const t=Date.now();
    // === SHINY VIBRANT BACKGROUND ===
    // Rich gradient sky with golden hour glow
    // Uniform bright green background — no dark areas
    ctx.fillStyle='#3CB371';ctx.fillRect(0,0,W,H);
    // Subtle variation patches (all bright)
    for(let i=0;i<10;i++){
      const px2=(i*170+cx*0.5)%W,py2=(i*130+cy*0.5)%H;
      const pg=ctx.createRadialGradient(px2,py2,0,px2,py2,100);
      pg.addColorStop(0,i%2===0?'rgba(80,200,120,0.15)':'rgba(46,139,87,0.12)');pg.addColorStop(1,'transparent');
      ctx.fillStyle=pg;ctx.fillRect(0,0,W,H);
    }

    // Shimmering light rays from top
    for(let i=0;i<6;i++){
      const rx=((i*180+t*0.01)%W);
      const rg=ctx.createLinearGradient(rx,0,rx+40,H);
      rg.addColorStop(0,`rgba(255,255,180,${0.03+Math.sin(t/2000+i)*0.015})`);rg.addColorStop(0.5,'rgba(255,255,150,0.01)');rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg;ctx.fillRect(rx-20,0,60,H);
    }

    // Animated grass blades (parallax)
    for(let i=0;i<180;i++){
      const gx=(i*97+cx*2.5)%W,gy=(i*211+cy*2.5)%H;
      const sway=Math.sin(t/800+i*0.3)*1.5;
      const brightness=100+Math.floor(Math.sin(t/1500+i)*20);
      ctx.fillStyle=`rgba(30,${brightness},45,0.2)`;
      ctx.fillRect(gx+sway,gy,1.5,5+i%4);
    }

    // Glowing sunlight pools
    for(let i=0;i<8;i++){
      const sx2=(i*170+cx*0.5+Math.sin(t/3000+i)*20)%W;
      const sy2=(i*130+cy*0.5+Math.cos(t/4000+i)*15)%H;
      const pulse=Math.sin(t/2000+i*1.5)*0.02+0.05;
      const sg=ctx.createRadialGradient(sx2,sy2,0,sx2,sy2,60+i*10);
      sg.addColorStop(0,`rgba(180,255,120,${pulse})`);sg.addColorStop(0.5,`rgba(100,220,80,${pulse*0.4})`);sg.addColorStop(1,'transparent');
      ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);
    }

    // Sparkle particles floating
    for(let i=0;i<25;i++){
      const spx=(i*131+t*0.02+cx)%W;
      const spy=(i*197+Math.sin(t/1000+i)*8+cy)%H;
      const sparkle=Math.sin(t/300+i*3)*0.5+0.5;
      ctx.fillStyle=`rgba(255,255,200,${sparkle*0.35})`;
      ctx.beginPath();ctx.arc(spx,spy,1+sparkle,0,Math.PI*2);ctx.fill();
    }

    // Subtle grid lines for depth
    ctx.strokeStyle='rgba(255,255,255,0.015)';ctx.lineWidth=0.5;
    for(let gx=0;gx<W;gx+=TILE){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
    for(let gy=0;gy<H;gy+=TILE){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}

    // Tiles
    for(let ty=0;ty<VY;ty++)for(let tx=0;tx<VX;tx++){
      const wx=cx+tx,wy=cy+ty;if(wx>=WW||wy>=WH)continue;
      const tile=getWorldTile(wx,wy),sx=tx*TILE,sy=ty*TILE;
      if(tile===T.NEBULA){const a=0.15+Math.sin((wx+wy)*0.5)*0.05;ctx.fillStyle=`rgba(30,15,70,${a})`;ctx.fillRect(sx,sy,TILE,TILE);continue;}
      // Core Hub floor glow
      const hubDx=wx-5000,hubDy=wy-5000,hubDist=Math.sqrt(hubDx*hubDx+hubDy*hubDy);
      if(hubDist<=25){
        const glow=Math.max(0,1-hubDist/25);
        ctx.fillStyle=`rgba(60,40,20,${0.15+glow*0.2})`;ctx.fillRect(sx,sy,TILE,TILE);
        // Hub grid pattern
        if((wx+wy)%3===0){ctx.fillStyle=`rgba(201,168,76,${0.05+glow*0.08})`;ctx.fillRect(sx+1,sy+1,TILE-2,TILE-2);}
      }
      if(tile===T.SPACE)continue;
      if(tile===T.ROCK||tile===T.ICE_ROCK||tile===T.GOLD_ROCK||tile===T.DARK_ROCK){
        const ri=ROCK_TYPES[tile]||ROCK_TYPES[T.ROCK];const r=TILE/2-2;
        // Use admin-configurable colors if available
        const gc=gameConfigRef.current;
        let c1=ri.col1,c2=ri.col2;
        if(tile===T.ROCK){c1=gc.mine_stone_color1||c1;c2=gc.mine_stone_color2||c2;}
        else if(tile===T.ICE_ROCK){c1=gc.mine_ice_color1||c1;c2=gc.mine_ice_color2||c2;}
        else if(tile===T.GOLD_ROCK){c1=gc.mine_gold_color1||c1;c2=gc.mine_gold_color2||c2;}
        else if(tile===T.DARK_ROCK){c1=gc.mine_dark_color1||c1;c2=gc.mine_dark_color2||c2;}
        const rg=ctx.createRadialGradient(sx+TILE/2-3,sy+TILE/2-4,2,sx+TILE/2,sy+TILE/2,r);
        rg.addColorStop(0,'#fff');rg.addColorStop(0.25,c2);rg.addColorStop(0.85,c1);rg.addColorStop(1,c1);
        ctx.fillStyle=rg;ctx.beginPath();ctx.arc(sx+TILE/2,sy+TILE/2,r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=c1;ctx.lineWidth=1;ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.ellipse(sx+TILE/2-3,sy+TILE/2-5,r*0.35,r*0.2,-.5,0,Math.PI*2);ctx.fill();
        if(tile===T.GOLD_ROCK){ctx.fillStyle='rgba(255,215,0,0.25)';ctx.beginPath();ctx.arc(sx+TILE/2,sy+TILE/2,r+3,0,Math.PI*2);ctx.fill();}
        if(tile===T.DARK_ROCK){ctx.fillStyle='rgba(147,112,219,0.25)';ctx.beginPath();ctx.arc(sx+TILE/2,sy+TILE/2,r+3,0,Math.PI*2);ctx.fill();}
        if(miningR.current&&Math.abs(pp.x-wx)<=1&&Math.abs(pp.y-wy)<=1){ctx.strokeStyle='#fbbf24';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.strokeRect(sx+1,sy+1,TILE-2,TILE-2);ctx.setLineDash([]);}
      }else if(tile===T.TURRET){
        ctx.fillStyle='#374151';ctx.fillRect(sx+4,sy+4,TILE-8,TILE-8);
        ctx.fillStyle='#ef4444';ctx.fillRect(sx+TILE/2-2,sy+4,4,TILE/2);
        ctx.fillStyle='#fca5a5';ctx.fillRect(sx+TILE/2-1,sy+4,2,3);
      }else if(tile===T.SHIELD_GEN){
        ctx.fillStyle='#1e3a5f';ctx.fillRect(sx+4,sy+4,TILE-8,TILE-8);
        const pulse=Math.sin(Date.now()/400)*3;
        ctx.strokeStyle='#3b82f680';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(sx+TILE/2,sy+TILE/2,TILE/2-1+pulse,0,Math.PI*2);ctx.stroke();
      }else if(tile===T.MINE_BOT){
        ctx.fillStyle='#78350f';ctx.fillRect(sx+6,sy+6,TILE-12,TILE-12);
        ctx.fillStyle='#f59e0b';ctx.fillRect(sx+TILE/2-3,sy+TILE/2-3,6,6);
      }else if(tile===T.REFINERY){
        ctx.fillStyle='#1c1917';ctx.fillRect(sx+3,sy+3,TILE-6,TILE-6);
        ctx.fillStyle='#f97316';ctx.fillRect(sx+6,sy+TILE/2-2,TILE-12,4);
        ctx.fillStyle='#fb923c';ctx.fillRect(sx+TILE/2-2,sy+6,4,TILE-12);
      }else if(tile===T.WARP_PAD){
        const pulse=Math.sin(Date.now()/300)*3;
        ctx.fillStyle='#4c1d9520';ctx.beginPath();ctx.arc(sx+TILE/2,sy+TILE/2,TILE/2+pulse,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#a855f7';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx+TILE/2,sy+TILE/2,8+pulse,0,Math.PI*2);ctx.stroke();
      }else if(tile===T.CRYSTAL){
        const glow=Math.sin(t/350)*0.3+0.7;
        ctx.shadowColor='#9f7aea';ctx.shadowBlur=12*glow;
        ctx.fillStyle='#805ad5';ctx.save();ctx.translate(sx+TILE/2,sy+TILE/2);ctx.rotate(t/800);
        ctx.fillRect(-8,-8,16,16);ctx.restore();
        ctx.fillStyle=`rgba(214,188,250,${glow})`;ctx.beginPath();ctx.arc(sx+TILE/2,sy+TILE/2,5,0,Math.PI*2);ctx.fill();
        
      }else if(tile===T.FUEL){
        ctx.fillStyle='#064e3b';ctx.fillRect(sx+6,sy+4,TILE-12,TILE-8);
        ctx.fillStyle='#10b981';ctx.fillRect(sx+9,sy+7,TILE-18,TILE-14);
        ctx.fillStyle='#6ee7b7';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('F',sx+TILE/2,sy+TILE/2+4);
      }else if(tile===T.PORTAL){
        const pulse=Math.sin(Date.now()/250)*4;ctx.save();ctx.translate(sx+TILE/2,sy+TILE/2);ctx.rotate(Date.now()/500);
        ctx.strokeStyle='#fbbf24';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,11+pulse,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle='#f59e0b80';ctx.beginPath();ctx.arc(0,0,7+pulse*0.5,0,Math.PI*1.5);ctx.stroke();
        ctx.restore();
      }else if(tile===T.STATION){
        ctx.fillStyle='#1e3a5f';ctx.fillRect(sx+3,sy+3,TILE-6,TILE-6);
        ctx.fillStyle='#2563eb';ctx.fillRect(sx+7,sy+7,TILE-14,TILE-14);
        ctx.fillStyle='#93c5fd';ctx.fillRect(sx+TILE/2-2,sy+TILE/2-2,4,4);
        ctx.fillStyle='#60a5fa40';ctx.beginPath();ctx.arc(sx+TILE/2,sy+TILE/2,TILE/2,0,Math.PI*2);ctx.fill();
      }else if(tile===T.POWERUP){
        const pu=puR.current.find(p2=>p2.x===wx&&p2.y===wy&&!p2.collected);
        if(pu){const bob=Math.sin(Date.now()/300)*3;
          ctx.fillStyle=pu.type.col+'40';ctx.beginPath();ctx.arc(sx+TILE/2,sy+TILE/2+bob,14,0,Math.PI*2);ctx.fill();
          ctx.font='18px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(pu.type.icon,sx+TILE/2,sy+TILE/2+bob);}
      }else if(BUILDINGS[tile]){
        // Diegetic building rendering
        const bldg=BUILDINGS[tile];
        const pulse=Math.sin(Date.now()/600+tile)*2;
        // Building base
        ctx.fillStyle=bldg.col2;ctx.fillRect(sx+2,sy+2,TILE-4,TILE-4);
        ctx.fillStyle=bldg.col;ctx.fillRect(sx+4,sy+4,TILE-8,TILE-8);
        // Glow
        ctx.fillStyle=bldg.col+'30';ctx.beginPath();ctx.arc(sx+TILE/2,sy+TILE/2,TILE/2+pulse+4,0,Math.PI*2);ctx.fill();
        // Icon
        ctx.font='bold 16px serif';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(bldg.icon,sx+TILE/2,sy+TILE/2);
      }
    }

    // Enemies with glow and shadow
    eR.current.filter(e=>e.alive).forEach(e=>{
      const sx=(e.x-cx)*TILE,sy=(e.y-cy)*TILE;if(sx<-TILE||sx>W||sy<-TILE||sy>H)return;
      const et=e.type||ENEMY_TYPES[0];
      ctx.shadowColor=et.col;ctx.shadowBlur=e.boss?14:7;
      ctx.fillStyle=et.col+'50';ctx.beginPath();ctx.arc(sx+TILE/2,sy+TILE/2,TILE/2-2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=et.col;ctx.beginPath();ctx.arc(sx+TILE/2,sy+TILE/2,TILE/2-5,0,Math.PI*2);ctx.fill();
      
      ctx.font=`${e.boss?TILE*0.5:TILE*0.4}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(et.icon,sx+TILE/2,sy+TILE/2);
      if(e.boss){ctx.fillStyle='#ecc94b';for(let i=0;i<3;i++)ctx.fillRect(sx+6+i*9,sy-1,3,6);}
      const hpP=e.hp/e.maxHp;ctx.fillStyle='#1a202c';ctx.fillRect(sx+2,sy-6,TILE-4,6);
      ctx.fillStyle=hpP>0.5?'#48bb78':hpP>0.25?'#ecc94b':'#fc8181';
      ctx.fillRect(sx+3,sy-5,(TILE-6)*hpP,4);
      ctx.strokeStyle='#2d3748';ctx.lineWidth=0.5;ctx.strokeRect(sx+2,sy-6,TILE-4,6);
    });

    // Bright glowing bullets
    bR.current.forEach(b=>{const bx=(b.x-cx)*TILE+TILE/2,by=(b.y-cy)*TILE+TILE/2;
      
      ctx.fillStyle=sc.cock;ctx.beginPath();ctx.arc(bx,by,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,2.5,0,Math.PI*2);ctx.fill();
      
      ctx.fillStyle=sc.cock+'60';ctx.beginPath();ctx.arc(bx-b.dx*9,by-b.dy*9,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=sc.cock+'25';ctx.beginPath();ctx.arc(bx-b.dx*18,by-b.dy*18,3,0,Math.PI*2);ctx.fill();
    });

    // Particles
    fxR.current.forEach(f=>{const age=(Date.now()-f.born)/700;ctx.globalAlpha=1-age;ctx.fillStyle=f.col;
      ctx.fillRect(f.x-cx*TILE+f.vx*age*25,f.y-cy*TILE+f.vy*age*25,3.5-age*3,3.5-age*3);});ctx.globalAlpha=1;

    // Player ship with glow
    const px=(pp.x-cx)*TILE,py=(pp.y-cy)*TILE;
    if(hasPU('shield')){ctx.strokeStyle='#63b3ed80';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(px+TILE/2,py+TILE/2,TILE/2+5,0,Math.PI*2);ctx.stroke();}
    if(hasPU('speed')){for(let i=1;i<=4;i++){ctx.fillStyle=sc.thrust+'40';ctx.fillRect(px+TILE/2-3,py+TILE+i*5,6,4);}}
    const fl=Math.random()*5;
    
    ctx.fillStyle=sc.thrust;ctx.beginPath();ctx.arc(px+TILE/2,py+TILE,5+fl,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px+TILE/2,py+TILE-1,2+fl*0.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=sc.body;ctx.beginPath();ctx.moveTo(px+TILE/2,py+2);ctx.lineTo(px+TILE-4,py+TILE-3);ctx.lineTo(px+4,py+TILE-3);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.15)';ctx.beginPath();ctx.moveTo(px+TILE/2,py+4);ctx.lineTo(px+TILE/2+8,py+TILE/2);ctx.lineTo(px+TILE/2,py+TILE/2);ctx.closePath();ctx.fill();
    ctx.fillStyle=sc.cock;ctx.beginPath();ctx.moveTo(px+TILE/2,py+8);ctx.lineTo(px+TILE/2+6,py+TILE/2+2);ctx.lineTo(px+TILE/2-6,py+TILE/2+2);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.arc(px+TILE/2-1,py+12,2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=sc.wing;ctx.fillRect(px+1,py+TILE-12,8,8);ctx.fillRect(px+TILE-9,py+TILE-12,8,8);
    // Magnet aura
    if(hasPU('magnet')){ctx.strokeStyle='#8b5cf640';ctx.setLineDash([3,3]);ctx.lineWidth=1;
      ctx.strokeRect(px-3*TILE+TILE/2,py-3*TILE+TILE/2,7*TILE,7*TILE);ctx.setLineDash([]);}

    // === RENDER OTHER PLAYERS (MMO) ===
    otherPlayersRef.current.forEach(op=>{
      const opx=(op.x-cx)*TILE,opy=(op.y-cy)*TILE;
      if(opx<-TILE*2||opx>W+TILE*2||opy<-TILE*2||opy>H+TILE*2)return; // off-screen cull
      const osc=op.shipColor||{body:'#60a5fa',wing:'#3b82f6',cock:'#93c5fd',thrust:'#f97316'};
      // Thrust flame
      const ofl=Math.random()*5;
      ctx.fillStyle=osc.thrust;ctx.beginPath();ctx.arc(opx+TILE/2,opy+TILE,5+ofl,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(opx+TILE/2,opy+TILE-1,2+ofl*0.3,0,Math.PI*2);ctx.fill();
      // Ship body
      ctx.fillStyle=osc.body;ctx.beginPath();ctx.moveTo(opx+TILE/2,opy+2);ctx.lineTo(opx+TILE-4,opy+TILE-3);ctx.lineTo(opx+4,opy+TILE-3);ctx.closePath();ctx.fill();
      // Highlight
      ctx.fillStyle='rgba(255,255,255,0.15)';ctx.beginPath();ctx.moveTo(opx+TILE/2,opy+4);ctx.lineTo(opx+TILE/2+8,opy+TILE/2);ctx.lineTo(opx+TILE/2,opy+TILE/2);ctx.closePath();ctx.fill();
      // Cockpit
      ctx.fillStyle=osc.cock;ctx.beginPath();ctx.moveTo(opx+TILE/2,opy+8);ctx.lineTo(opx+TILE/2+6,opy+TILE/2+2);ctx.lineTo(opx+TILE/2-6,opy+TILE/2+2);ctx.closePath();ctx.fill();
      // Canopy dot
      ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.arc(opx+TILE/2-1,opy+12,2,0,Math.PI*2);ctx.fill();
      // Wings
      ctx.fillStyle=osc.wing;ctx.fillRect(opx+1,opy+TILE-12,8,8);ctx.fillRect(opx+TILE-9,opy+TILE-12,8,8);
      // Name tag
      ctx.fillStyle='#fff';ctx.font='bold 9px Georgia';ctx.textAlign='center';
      ctx.fillText((op.email||'Player').split('@')[0],opx+TILE/2,opy-4);
      ctx.textAlign='left';
    });

    // Mining progress bar
    if(miningR.current&&pR.current.miningProg>0){
      ctx.fillStyle='#0f172a';ctx.fillRect(px-5,py-12,TILE+10,6);
      ctx.fillStyle='#f59e0b';ctx.fillRect(px-4,py-11,(TILE+8)*(pR.current.miningProg/100),4);
    }

    // Core Hub label
    const hubScreenX=(5000-cx)*TILE,hubScreenY=(5000-cy)*TILE;
    if(hubScreenX>-200&&hubScreenX<W+200&&hubScreenY>-200&&hubScreenY<H+200){
      ctx.fillStyle='#c9a84c';ctx.font='bold 14px Georgia';ctx.textAlign='center';
      ctx.fillText('⚡ CORE HUB ⚡',hubScreenX,hubScreenY-30);
      ctx.fillStyle='#a08c6a';ctx.font='10px Georgia';
      ctx.fillText('Safe Zone · Walk to buildings to interact',hubScreenX,hubScreenY-16);

      // Building labels
      var bldgPositions = [
        [0,-8,'Mission Terminal','#10b981'], [6,-6,'Marketplace','#c9a84c'],
        [8,0,'Job Hall','#8b5cf6'], [6,6,'Research Lab','#3b82f6'],
        [0,8,'Guild Hall','#f59e0b'], [-6,6,'Social Hub','#06b6d4'],
        [-8,0,'Empire Tower','#6366f1'], [-6,-6,'Battle Arena','#ef4444'],
        [3.5,-3.5,'Identity','#ec4899'], [-3.5,3.5,'Nodes','#14b8a6'],
      ];
      ctx.font='bold 8px Georgia';
      for(var bi=0;bi<bldgPositions.length;bi++){
        var bp=bldgPositions[bi];
        var bsx=hubScreenX+bp[0]*TILE,bsy=hubScreenY+bp[1]*TILE-TILE;
        if(bsx>-100&&bsx<W+100&&bsy>-50&&bsy<H+50){
          ctx.fillStyle=bp[3];ctx.fillText(bp[2],bsx,bsy);
        }
      }
      ctx.textAlign='left';
    }

    if(showMini)drawMinimap();
  }

  function drawMinimap(){
    const mc=miniC.current;if(!mc)return;const ctx=mc.getContext('2d');
    const pp=pR.current;const mw=mc.width,mh=mc.height;const range=Math.floor(mw/2);
    ctx.fillStyle='#080810';ctx.fillRect(0,0,mw,mh);
    // Draw tiles around player
    for(let dy=-range;dy<range;dy++)for(let dx=-range;dx<range;dx++){
      const wx=pp.x+dx,wy=pp.y+dy;const t=getWorldTile(wx,wy);
      const mx=dx+range,my=dy+range;
      if(t===T.ROCK){ctx.fillStyle='#3d2b1f';ctx.fillRect(mx,my,1,1);}
      else if(t===T.ICE_ROCK){ctx.fillStyle='#60a5fa';ctx.fillRect(mx,my,1,1);}
      else if(t===T.GOLD_ROCK){ctx.fillStyle='#fbbf24';ctx.fillRect(mx,my,1,1);}
      else if(t===T.DARK_ROCK){ctx.fillStyle='#6b21a8';ctx.fillRect(mx,my,1,1);}
      else if(t===T.CRYSTAL){ctx.fillStyle='#8b5cf6';ctx.fillRect(mx,my,1,1);}
      else if(t>=T.STATION&&t<=T.WARP_PAD){ctx.fillStyle='#3b82f6';ctx.fillRect(mx,my,1,1);}
      else if(t===T.PORTAL){ctx.fillStyle='#f59e0b';ctx.fillRect(mx,my,1,1);}
      else if(t===T.FUEL){ctx.fillStyle='#10b981';ctx.fillRect(mx,my,1,1);}
      else if(t===T.ENEMY){ctx.fillStyle='#ef4444';ctx.fillRect(mx,my,1,1);}
      else if(t===T.POWERUP){ctx.fillStyle='#ec4899';ctx.fillRect(mx,my,1,1);}
    }
    // Player dot
    ctx.fillStyle='#00f0ff';ctx.fillRect(range-1,range-1,3,3);
    // Viewport box
    const{VX,VY}=gameSizeRef.current;
    ctx.strokeStyle='#ffffff30';ctx.strokeRect(range-Math.floor(VX/2),range-Math.floor(VY/2),VX,VY);
  }

  const restart=()=>{worldMods={};setEnemies([]);setPowerups([]);
    const nx=5000,ny=5000;
    setP({x:nx,y:ny,hp:100,mhp:100,fuel:100,mfuel:100,atk:15,def:5,xp:0,lv:1,cry:0,cred:0,kills:0,structs:0,ore:0,rareOre:0,miningProg:0,
      inv:{stone:0,iron:0,crystal:0,ice:0,water:0,diamond:0,gold:0,platinum:0,artifact:0,dark_matter:0,void_crystal:0,singularity:0},
      turrets:[],mineBots:[],shieldGens:[],refineries:[],warpPads:[],totalMined:0,bossKills:0,powerupsCollected:0});
    setBullets([]);setFx([]);setMsgs([]);setScore(0);setTime(0);setActivePowerups([]);setPhase('playing');setBuildMenu(false);};

  const startGame=()=>setPhase('playing');
  const{TILE,VX,VY}=gameSize;
  const cW=VX*TILE,cH=VY*TILE;
  const isMobile=window.innerWidth<768;
  const hpPct=(p.hp/p.mhp)*100,fuelPct=(p.fuel/p.mfuel)*100,xpPct=(p.xp/(p.lv*100))*100;
  const fmt=(s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const touchBtn={width:44,height:44,background:'#3d2b1f',border:'2px solid #8b6914',borderRadius:'0.3rem',color:'#f5e6c8',fontSize:'1rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',userSelect:'none',WebkitUserSelect:'none',touchAction:'manipulation'};

  // FFT color palette
  const FFT = {
    bg:'#1a1208', bgLight:'#2a1f10', panel:'#1e1610', panelBorder:'#5c4a2a',
    gold:'#c9a84c', goldLight:'#e8d48b', goldDark:'#8b6914',
    parchment:'#f5e6c8', parchmentDark:'#d4b896',
    text:'#f5e6c8', textDim:'#a08c6a', textBright:'#ffe4a0',
    red:'#a03030', redLight:'#d44040', blue:'#2a4a8a', blueLight:'#4a7acc',
    green:'#2a6a2a', greenLight:'#4aaa4a',
    accent:'linear-gradient(135deg,#c9a84c,#8b6914)',
    panelGrad:'linear-gradient(180deg,#2a1f10 0%,#1a1208 100%)',
  };

  // === CUSTOMIZATION SCREEN ===
  if(phase==='customize') return(
    <div style={{background:`radial-gradient(ellipse at center,#2a1f10 0%,#0d0a04 100%)`,minHeight:'100vh',color:FFT.text,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"Georgia,'Times New Roman',serif"}}>
      <div style={{maxWidth:600,width:'100%',padding:'1.5rem'}}>
        {/* Title with ornate style */}
        <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
          <div style={{fontSize:'0.7rem',color:FFT.goldDark,letterSpacing:'0.3rem',textTransform:'uppercase'}}>— The Chronicles of —</div>
          <h1 style={{fontSize:'2.2rem',margin:'0.25rem 0',color:FFT.gold,textShadow:'0 2px 8px rgba(201,168,76,0.3)',fontWeight:400,fontStyle:'italic'}}>Space Out</h1>
          <div style={{fontSize:'0.75rem',color:FFT.textDim}}>Forge your destiny among the stars</div>
          <div style={{width:'60%',height:'1px',background:`linear-gradient(90deg,transparent,${FFT.goldDark},transparent)`,margin:'0.75rem auto'}} />
        </div>

        {/* Ship Name */}
        <div style={{background:FFT.panel,border:`2px solid ${FFT.panelBorder}`,borderRadius:'0.5rem',padding:'1.25rem',marginBottom:'1rem'}}>
          <label style={{fontSize:'0.7rem',color:FFT.gold,fontWeight:700,display:'block',marginBottom:'0.4rem',letterSpacing:'0.15rem',textTransform:'uppercase'}}>Vessel Name</label>
          <input value={shipName} onChange={e=>setShipName(e.target.value)} maxLength={20}
            style={{width:'100%',padding:'0.6rem',background:FFT.bg,border:`1px solid ${FFT.panelBorder}`,borderRadius:'0.3rem',color:FFT.parchment,fontSize:'1rem',outline:'none',boxSizing:'border-box',fontFamily:'inherit'}} />
        </div>

        {/* Ship Selection */}
        <div style={{background:FFT.panel,border:`2px solid ${FFT.panelBorder}`,borderRadius:'0.5rem',padding:'1.25rem',marginBottom:'1rem'}}>
          <label style={{fontSize:'0.7rem',color:FFT.gold,fontWeight:700,display:'block',marginBottom:'0.6rem',letterSpacing:'0.15rem',textTransform:'uppercase'}}>Choose Your Vessel</label>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(3,1fr)':'repeat(4,1fr)',gap:'0.5rem'}}>
            {SHIP_COLORS.map(sc=>(
              <div key={sc.id} onClick={()=>setShipColor(sc)}
                style={{padding:'0.75rem 0.5rem',background:shipColor.id===sc.id?FFT.bgLight:FFT.bg,
                  border:`2px solid ${shipColor.id===sc.id?FFT.gold:FFT.panelBorder}`,
                  borderRadius:'0.4rem',cursor:'pointer',textAlign:'center',transition:'all 0.2s',
                  boxShadow:shipColor.id===sc.id?`0 0 12px ${FFT.goldDark}40`:'none'}}>
                <svg width="40" height="40" viewBox="0 0 48 48" style={{display:'block',margin:'0 auto 0.3rem'}}>
                  <polygon points="24,4 40,42 8,42" fill={sc.body}/>
                  <polygon points="24,14 30,28 18,28" fill={sc.cock}/>
                  <rect x="4" y="34" width="8" height="8" fill={sc.wing} rx="1"/>
                  <rect x="36" y="34" width="8" height="8" fill={sc.wing} rx="1"/>
                  <circle cx="24" cy="44" r="5" fill={sc.thrust} opacity="0.6"/>
                </svg>
                <div style={{fontSize:'0.65rem',fontWeight:600,color:shipColor.id===sc.id?FFT.goldLight:FFT.textDim}}>{sc.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={{background:FFT.panel,border:`2px solid ${FFT.panelBorder}`,borderRadius:'0.5rem',padding:'0.85rem',marginBottom:'1.25rem',fontSize:'0.72rem',color:FFT.textDim}}>
          <div style={{fontWeight:700,color:FFT.gold,marginBottom:'0.4rem',letterSpacing:'0.1rem',textTransform:'uppercase',fontSize:'0.65rem'}}>Battle Controls</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.25rem'}}>
            <span>WASD — Move</span><span>Space — Attack</span>
            <span>M — Mine</span><span>B — Build</span>
            <span>P — Pause</span><span>I — Minimap</span>
          </div>
        </div>

        {/* Launch Button */}
        <button onClick={()=>{SFX.initAudio();SFX.playClick();startGame();}}
          style={{width:'100%',padding:'0.9rem',background:FFT.accent,color:'#1a1208',border:`2px solid ${FFT.gold}`,borderRadius:'0.4rem',fontSize:'1.1rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.05rem',boxShadow:`0 4px 20px ${FFT.goldDark}60`,transition:'transform 0.15s'}}>
          ⚔️ BEGIN CAMPAIGN — {shipName}
        </button>
        <div style={{textAlign:'center',marginTop:'0.75rem'}}>
          <Link to="/ar-explore" style={{color:FFT.greenLight,fontSize:'0.8rem',textDecoration:'none'}}>🌍 AR Explorer</Link>
          <span style={{margin:'0 0.75rem',color:FFT.panelBorder}}>✦</span>
          <Link to="/space" style={{color:FFT.blueLight,fontSize:'0.8rem',textDecoration:'none'}}>🌌 3D Space</Link>
        </div>
      </div>
    </div>
  );

  // === GAME OVER ===
  if(phase==='over') return(
    <div style={{background:`radial-gradient(ellipse at center,#2a1008 0%,#0d0604 100%)`,minHeight:'100vh',color:FFT.text,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"Georgia,'Times New Roman',serif"}}>
      <div style={{maxWidth:450,width:'100%',padding:'2rem',textAlign:'center'}}>
        <div style={{fontSize:'4rem',marginBottom:'0.5rem'}}>💀</div>
        <h2 style={{fontSize:'1.8rem',marginBottom:'0.25rem',color:FFT.redLight,fontStyle:'italic'}}>Campaign Lost</h2>
        <p style={{color:FFT.textDim,marginBottom:'1.5rem'}}>Vessel "{shipName}" fell in sector {Math.floor(p.x/10)}-{Math.floor(p.y/10)}</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.6rem',marginBottom:'1.5rem',textAlign:'left'}}>
          {[['⚔️ Level',p.lv],['⏱ Time',fmt(time)],['💀 Kills',p.kills],['💎 Crystals',p.cry],['💰 Credits',p.cred],['🏗️ Stations',p.structs],['⛏️ Ore',p.ore],['✨ Rare',p.rareOre],['🏆 Score',score],['⭐ XP',p.lv*100+p.xp]].map(([l,v],i)=>(
            <div key={i} style={{background:FFT.panel,border:`1px solid ${FFT.panelBorder}`,padding:'0.5rem 0.75rem',borderRadius:'0.3rem'}}>
              <div style={{fontSize:'0.65rem',color:FFT.textDim}}>{l}</div>
              <div style={{fontSize:'1.1rem',fontWeight:700,color:FFT.goldLight}}>{v}</div>
            </div>))}
        </div>
        <div style={{display:'flex',gap:'0.75rem',justifyContent:'center'}}>
          <button onClick={restart} style={{padding:'0.75rem 1.5rem',background:FFT.accent,color:'#1a1208',border:`2px solid ${FFT.gold}`,borderRadius:'0.4rem',fontSize:'1rem',cursor:'pointer',fontWeight:700,fontFamily:'inherit'}}>⚔️ Fight Again</button>
        </div>
      </div>
    </div>
  );
  return(
    <div style={{background:'#0d0a04',minHeight:'100vh',color:FFT.text,fontFamily:"Georgia,'Times New Roman',serif"}}>
      {/* Active powerups — floating pills, no bar */}
      {activePowerups.length>0&&(
        <div style={{position:'fixed',top:8,left:'50%',transform:'translateX(-50%)',display:'flex',gap:'0.4rem',zIndex:60,pointerEvents:'none'}}>
          {activePowerups.map((a,i)=>{const rem=Math.max(0,Math.ceil((a.until-Date.now())/1000));return(
            <span key={i} style={{fontSize:'0.7rem',padding:'0.2rem 0.5rem',background:'rgba(26,18,8,0.9)',border:`1px solid ${a.type.col}60`,borderRadius:'1rem',color:a.type.col,backdropFilter:'blur(4px)'}}>
              {a.type.icon} {rem}s
            </span>);})}
        </div>
      )}

      {/* GAME AREA — TRULY FULL SCREEN */}
      <div style={{position:'relative',width:'100vw',height:'100vh',overflow:'hidden'}}>
        {/* CANVAS — fills entire viewport */}
        <canvas ref={cvs} width={Math.floor(window.innerWidth)} height={Math.floor(window.innerHeight)} tabIndex={0}
          style={{display:'block',width:'100%',height:'100%'}}
          onClick={(e)=>{
            // Detect click on other players
            const{TILE,VX,VY}=gameSizeRef.current;
            const pp=pR.current;
            const cx=Math.max(0,Math.min(pp.x-Math.floor(VX/2),WW-VX));
            const cy=Math.max(0,Math.min(pp.y-Math.floor(VY/2),WH-VY));
            const rect=cvs.current.getBoundingClientRect();
            const mx=e.clientX-rect.left;
            const my=e.clientY-rect.top;
            const tx=Math.floor(mx/TILE)+cx;
            const ty=Math.floor(my/TILE)+cy;
            // Check if clicked on another player
            const clicked=otherPlayersRef.current.find(op=>Math.abs(op.x-tx)<=1&&Math.abs(op.y-ty)<=1);
            if(clicked){setSelectedPlayer(clicked);setPaused(true);}
          }}
        />

        {/* Minimap overlay — top-left */}
        {showMini&&<canvas ref={miniC} width={160} height={160}
          style={{position:'absolute',top:6,left:6,border:`1px solid ${FFT.panelBorder}`,borderRadius:'0.25rem',opacity:0.85,zIndex:5}}/>}

        {/* Minimal floating HUD — top-right */}
        <div style={{position:'absolute',top:6,right:6,width:'130px',display:'flex',flexDirection:'column',gap:'0.25rem',zIndex:5}}>
          {/* Ship name + level */}
          <div style={{background:'rgba(26,18,8,0.85)',border:`1px solid ${FFT.panelBorder}`,borderRadius:'0.3rem',padding:'0.25rem 0.4rem',backdropFilter:'blur(4px)',textAlign:'center'}}>
            <span style={{fontSize:'0.65rem',fontWeight:700,color:FFT.gold}}>{shipName}</span>
            <span style={{fontSize:'0.6rem',color:FFT.textDim,marginLeft:'0.3rem'}}>Lv.{p.lv}</span>
          </div>
          {[['❤️',p.hp,p.mhp,hpPct,hpPct>50?'#48bb78':hpPct>25?'#ecc94b':'#fc8181'],
            ['⛽',p.fuel,p.mfuel,fuelPct,fuelPct>40?'#ecc94b':fuelPct>20?'#ed8936':'#fc8181'],
            ['⭐',p.xp,p.lv*100,xpPct,'#b794f4']].map(([icon,cur,max,pct,col],i)=>(
            <div key={i} style={{background:'rgba(26,18,8,0.85)',border:`1px solid ${FFT.panelBorder}`,borderRadius:'0.3rem',padding:'0.25rem 0.4rem',backdropFilter:'blur(4px)'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.6rem',color:FFT.textDim,marginBottom:'0.15rem'}}><span>{icon}</span><span style={{color:FFT.goldLight}}>{cur}/{max}</span></div>
              <div style={{height:'5px',background:'rgba(0,0,0,0.4)',borderRadius:'3px',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:col,borderRadius:'3px',transition:'width 0.2s'}}/></div>
            </div>))}
          {mining&&p.miningProg>0&&(
            <div style={{background:'rgba(26,18,8,0.85)',border:`1px solid ${FFT.goldDark}`,borderRadius:'0.3rem',padding:'0.25rem 0.4rem'}}>
              <div style={{fontSize:'0.55rem',color:FFT.gold,marginBottom:'0.1rem'}}>⛏️ Mining</div>
              <div style={{height:'5px',background:'rgba(0,0,0,0.4)',borderRadius:'3px',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${p.miningProg}%`,background:'#ecc94b',borderRadius:'3px'}}/></div>
            </div>)}
          {/* Resources — compact */}
          <div style={{background:'rgba(26,18,8,0.85)',border:`1px solid ${FFT.panelBorder}`,borderRadius:'0.3rem',padding:'0.25rem 0.4rem',fontSize:'0.55rem',color:FFT.textDim}}>
            <div>💎{p.cry} 💰{p.cred} 💀{p.kills}</div>
            <div>⚔️{p.atk} 🛡️{p.def} 🏗️{p.structs}</div>
          </div>
          {/* Online players */}
          <div style={{background:'rgba(26,18,8,0.85)',border:`1px solid ${FFT.panelBorder}`,borderRadius:'0.3rem',padding:'0.25rem 0.4rem',fontSize:'0.55rem',color:FFT.textDim}}>
            <span style={{color:'#4aaa4a'}}>🌐 {onlineCount} online</span>
            {otherPlayers.length>0&&<span style={{marginLeft:'0.3rem',color:'#60a5fa'}}>👥 {otherPlayers.length} nearby</span>}
          </div>
          {worldEvents.length>0&&(
            <div style={{background:'rgba(60,20,10,0.9)',border:`1px solid #c9a84c`,borderRadius:'0.3rem',padding:'0.25rem 0.4rem',fontSize:'0.55rem',color:'#c9a84c',fontWeight:700}}>
              {worldEvents[0].name||worldEvents[0].id}
            </div>
          )}
          {/* Minimal controls */}
          <div style={{display:'flex',gap:'0.2rem'}}>
            <button onClick={()=>{const m=!soundOn;setSoundOn(m);SFX.setMuted(!m);}} style={{flex:1,background:'rgba(26,18,8,0.85)',border:`1px solid ${FFT.panelBorder}`,color:FFT.textDim,padding:'0.15rem',borderRadius:'0.2rem',cursor:'pointer',fontSize:'0.65rem'}}>{soundOn?'🔊':'🔇'}</button>
            <button onClick={()=>setShowMini(v=>!v)} style={{flex:1,background:'rgba(26,18,8,0.85)',border:`1px solid ${FFT.panelBorder}`,color:FFT.textDim,padding:'0.15rem',borderRadius:'0.2rem',cursor:'pointer',fontSize:'0.65rem'}}>🗺️</button>
            <button onClick={()=>setPaused(v=>!v)} style={{flex:1,background:'rgba(26,18,8,0.85)',border:`1px solid ${FFT.panelBorder}`,color:FFT.textDim,padding:'0.15rem',borderRadius:'0.2rem',cursor:'pointer',fontSize:'0.65rem'}}>{paused?'▶':'⏸'}</button>
          </div>
        </div>

        {/* RIGHT overlay — Log */}
        {!isMobile && (
        <div style={{position:'absolute',bottom:6,right:6,width:'160px',zIndex:5}}>
          <div style={{background:'rgba(26,18,8,0.85)',border:`1px solid ${FFT.panelBorder}`,borderRadius:'0.3rem',padding:'0.3rem',maxHeight:'120px',overflowY:'auto',backdropFilter:'blur(4px)'}}>
            <div style={{fontWeight:700,fontSize:'0.55rem',color:FFT.gold,marginBottom:'0.15rem'}}>📜 LOG</div>
            {msgs.slice(-6).map((m,i)=><div key={i} style={{fontSize:'0.55rem',color:FFT.textDim,lineHeight:1.3}}>{m.t}</div>)}
          </div>
        </div>
        )}
      </div>

      {/* Mobile touch controls */}
      {isMobile && phase==='playing' && (
        <div style={{display:'flex',justifyContent:'space-between',padding:'0.3rem 0.5rem',gap:'0.3rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.2rem',width:'120px'}}>
            <div/>
            <button onTouchStart={()=>{keys.current['w']=true}} onTouchEnd={()=>{keys.current['w']=false}} style={touchBtn}>▲</button>
            <div/>
            <button onTouchStart={()=>{keys.current['a']=true}} onTouchEnd={()=>{keys.current['a']=false}} style={touchBtn}>◀</button>
            <button onTouchStart={()=>{keys.current['s']=true}} onTouchEnd={()=>{keys.current['s']=false}} style={touchBtn}>▼</button>
            <button onTouchStart={()=>{keys.current['d']=true}} onTouchEnd={()=>{keys.current['d']=false}} style={touchBtn}>▶</button>
          </div>
          <div style={{display:'flex',gap:'0.3rem',alignItems:'center'}}>
            <button onTouchStart={()=>{keys.current[' ']=true}} onTouchEnd={()=>{keys.current[' ']=false}} style={{...touchBtn,width:60,height:60,borderRadius:'50%',background:'#ef4444',fontSize:'0.8rem'}}>🔫</button>
            <button onTouchStart={()=>{keys.current['m']=true}} onTouchEnd={()=>{keys.current['m']=false}} style={{...touchBtn,width:50,height:50,borderRadius:'50%',background:'#f59e0b',fontSize:'0.7rem'}}>⛏️</button>
            <button onTouchStart={()=>{keys.current['b']=true;setTimeout(()=>{keys.current['b']=false},200)}} style={{...touchBtn,width:50,height:50,borderRadius:'50%',background:'#3b82f6',fontSize:'0.7rem'}}>🏗️</button>
          </div>
        </div>
      )}

      {/* PAUSE — FFT style */}
      {paused&&!activePanel&&(
        <div style={{position:'fixed',inset:0,background:'rgba(13,10,4,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:FFT.panel,padding:'2rem',borderRadius:'0.5rem',textAlign:'center',border:`2px solid ${FFT.panelBorder}`,maxWidth:350,fontFamily:"Georgia,serif"}}>
            <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>⏸</div>
            <h2 style={{marginBottom:'0.5rem',color:FFT.gold,fontStyle:'italic'}}>Campaign Paused</h2>
            <p style={{color:FFT.textDim,marginBottom:'1rem',fontSize:'0.85rem'}}>Vessel: {shipName}</p>
            <div style={{display:'flex',gap:'0.5rem',justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={()=>setPaused(false)} style={{padding:'0.6rem 1.5rem',background:FFT.accent,color:'#1a1208',border:`2px solid ${FFT.gold}`,borderRadius:'0.3rem',cursor:'pointer',fontWeight:700,fontFamily:'inherit'}}>▶ Resume</button>
              <button onClick={()=>{setPhase('customize');setPaused(false);}} style={{padding:'0.6rem 1rem',background:FFT.bg,color:FFT.textDim,border:`1px solid ${FFT.panelBorder}`,borderRadius:'0.3rem',cursor:'pointer',fontWeight:600,fontFamily:'inherit'}}>🎨 Customize</button>
            </div>
          </div>
        </div>
      )}

      {/* === BUILD MENU === */}
      {buildMenu && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,10,0.9)',zIndex:180,display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={()=>setBuildMenu(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:'0.75rem',padding:'1rem',maxWidth:400,width:'90%'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
              <h3 style={{color:'#e2e8f0',margin:0,fontSize:'1rem'}}>🏗️ Build Structure</h3>
              <button onClick={()=>setBuildMenu(false)} style={{background:'none',border:'none',color:'#94a3b8',fontSize:'1.2rem',cursor:'pointer'}}>✕</button>
            </div>
            <div style={{fontSize:'0.7rem',color:'#64748b',marginBottom:'0.5rem'}}>Inventory: {Object.entries(p.inv).filter(([,v])=>v>0).map(([k,v])=>`${RESOURCES[k]?.icon||''}${v}`).join(' ') || 'Empty'}</div>
            {BUILDABLE.map(b=>{
              const canBuild=Object.entries(b.cost).every(([res,amt])=>(p.inv[res]||0)>=amt);
              const canPlace=getWorldTile(p.x,p.y)===T.SPACE||getWorldTile(p.x,p.y)===T.NEBULA;
              return(
                <div key={b.id} style={{background:'#1e293b',borderRadius:'0.5rem',padding:'0.6rem',marginBottom:'0.4rem',opacity:canBuild&&canPlace?1:0.5}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <span style={{fontSize:'1rem'}}>{b.icon}</span>
                      <strong style={{marginLeft:'0.4rem',fontSize:'0.85rem',color:'#e2e8f0'}}>{b.name}</strong>
                      <div style={{fontSize:'0.68rem',color:'#64748b',marginTop:'0.1rem'}}>{b.desc}</div>
                      <div style={{fontSize:'0.68rem',color:'#94a3b8',marginTop:'0.1rem'}}>
                        Cost: {Object.entries(b.cost).map(([res,amt])=>`${RESOURCES[res]?.icon||res}${amt}`).join(' ')}
                      </div>
                    </div>
                    <button disabled={!canBuild||!canPlace} onClick={()=>{
                      setWorldTile(p.x,p.y,b.tile);
                      const newInv={...p.inv};Object.entries(b.cost).forEach(([res,amt])=>{newInv[res]-=amt;});
                      setP(pr=>({...pr,inv:newInv,structs:pr.structs+1,xp:pr.xp+b.xp}));
                      msg(`${b.icon} ${b.name} built! +${b.xp}XP`);SFX.playBuild();setBuildMenu(false);
                    }} style={{padding:'0.4rem 0.7rem',background:canBuild&&canPlace?'#10b981':'#374151',color:'white',border:'none',borderRadius:'0.35rem',fontWeight:700,cursor:canBuild&&canPlace?'pointer':'not-allowed',fontSize:'0.8rem'}}>
                      Build
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === BUILDING INTERACTION PROMPT === */}
      {nearbyBuilding && !activePanel && phase==='playing' && (
        <div style={{position:'fixed',bottom:isMobile?80:20,left:'50%',transform:'translateX(-50%)',
          background:'rgba(26,18,8,0.95)',border:'2px solid '+nearbyBuilding.col,borderRadius:'0.5rem',
          padding:'0.6rem 1.2rem',zIndex:55,textAlign:'center',backdropFilter:'blur(8px)',
          boxShadow:'0 0 20px '+nearbyBuilding.col+'40',minWidth:200}}>
          <div style={{fontSize:'1.5rem',marginBottom:'0.2rem'}}>{nearbyBuilding.icon}</div>
          <div style={{fontSize:'0.9rem',fontWeight:700,color:nearbyBuilding.col,fontFamily:'Georgia,serif'}}>{nearbyBuilding.name}</div>
          <div style={{fontSize:'0.7rem',color:'#a08c6a',marginBottom:'0.4rem'}}>{nearbyBuilding.desc}</div>
          <button onClick={function(){setActivePanel(nearbyBuilding.panel);setPaused(true);SFX.playClick();}}
            style={{padding:'0.4rem 1rem',background:nearbyBuilding.col,color:'#fff',border:'none',borderRadius:'0.3rem',
              fontWeight:700,cursor:'pointer',fontSize:'0.8rem',fontFamily:'Georgia,serif'}}>
            Press E or Tap to Enter
          </button>
        </div>
      )}

      {/* === WORLD EVENT BANNER — floating, center-top === */}
      {worldEvents.length>0&&phase==='playing'&&(
        <div style={{position:'fixed',top:12,left:'50%',transform:'translateX(-50%)',
          background:'rgba(60,20,10,0.95)',border:'2px solid #c9a84c',borderRadius:'0.5rem',
          padding:'0.4rem 1rem',zIndex:60,textAlign:'center',backdropFilter:'blur(8px)',
          boxShadow:'0 0 20px rgba(201,168,76,0.3)',pointerEvents:'none',maxWidth:300}}>
          <div style={{fontSize:'0.7rem',color:'#c9a84c',fontWeight:700}}>⚡ WORLD EVENT</div>
          <div style={{fontSize:'0.8rem',color:'#f5e6c8',fontWeight:700}}>{worldEvents[0].name||worldEvents[0].id}</div>
          {worldEvents[0].description&&<div style={{fontSize:'0.65rem',color:'#a08c6a'}}>{worldEvents[0].description}</div>}
        </div>
      )}

      {/* === PLAYER PROFILE MODAL (click another player) === */}
      {selectedPlayer && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}
          onClick={()=>{setSelectedPlayer(null);setPaused(false);}}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:'rgba(26,18,8,0.98)',border:'2px solid #5c4a2a',borderRadius:'0.75rem',padding:'1.5rem',maxWidth:320,width:'90%',fontFamily:'Georgia,serif'}}>
            <div style={{textAlign:'center',marginBottom:'1rem'}}>
              <div style={{fontSize:'3rem',marginBottom:'0.3rem'}}>🚀</div>
              <div style={{fontSize:'1.1rem',fontWeight:700,color:'#c9a84c'}}>{(selectedPlayer.email||'Player').split('@')[0]}</div>
              <div style={{fontSize:'0.75rem',color:'#a08c6a',marginTop:'0.2rem'}}>
                {selectedPlayer.profile?.status||'Exploring'} · {selectedPlayer.profile?.shipColor?.name||'Unknown Vessel'}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginBottom:'1rem'}}>
              {[['Rank',selectedPlayer.profile?.rank||1],['Zone',selectedPlayer.zone||'Overworld'],['X',selectedPlayer.x||0],['Y',selectedPlayer.y||0]].map(([l,v])=>(
                <div key={l} style={{background:'#1e1610',border:'1px solid #5c4a2a',borderRadius:'0.3rem',padding:'0.4rem',textAlign:'center'}}>
                  <div style={{fontSize:'0.6rem',color:'#a08c6a'}}>{l}</div>
                  <div style={{fontWeight:700,color:'#f5e6c8',fontSize:'0.85rem'}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'0.5rem'}}>
              <button onClick={()=>{
                if(socketRef.current){socketRef.current.emit('social:challenge',{targetId:selectedPlayer.userId});}
                msg(`⚔️ Challenge sent to ${(selectedPlayer.email||'Player').split('@')[0]}!`);
                setSelectedPlayer(null);setPaused(false);
              }} style={{flex:1,padding:'0.5rem',background:'#ef4444',color:'white',border:'none',borderRadius:'0.4rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:'0.8rem'}}>
                ⚔️ Challenge
              </button>
              <button onClick={()=>{
                if(socketRef.current){socketRef.current.emit('social:wave',{targetId:selectedPlayer.userId});}
                msg(`👋 Waved at ${(selectedPlayer.email||'Player').split('@')[0]}!`);
                setSelectedPlayer(null);setPaused(false);
              }} style={{flex:1,padding:'0.5rem',background:'#10b981',color:'white',border:'none',borderRadius:'0.4rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:'0.8rem'}}>
                👋 Wave
              </button>
              <button onClick={()=>{setSelectedPlayer(null);setPaused(false);}}
                style={{padding:'0.5rem 0.75rem',background:'#1e1610',color:'#a08c6a',border:'1px solid #5c4a2a',borderRadius:'0.4rem',cursor:'pointer',fontFamily:'inherit',fontSize:'0.8rem'}}>
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === DIEGETIC RADIAL MENU (replaces all bottom menus) === */}
      {showRadial && !activePanel && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:150,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}
          onClick={()=>setShowRadial(false)}>
          <div onClick={e=>e.stopPropagation()} style={{position:'relative',width:340,height:340}}>
            {/* Center hub */}
            <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
              width:70,height:70,borderRadius:'50%',background:'rgba(26,18,8,0.95)',border:'2px solid #c9a84c',
              display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',zIndex:10}}>
              <div style={{fontSize:'1.2rem'}}>🚀</div>
              <div style={{fontSize:'0.55rem',color:'#c9a84c',fontWeight:700}}>TAB</div>
            </div>
            {/* Radial items */}
            {RADIAL_ACTIONS.map((item,i)=>{
              const angle=(i/RADIAL_ACTIONS.length)*Math.PI*2-Math.PI/2;
              const radius=130;
              const x=Math.cos(angle)*radius;
              const y=Math.sin(angle)*radius;
              return(
                <button key={item.id}
                  onClick={()=>{setActivePanel(item.id);setPaused(true);setShowRadial(false);SFX.playClick();}}
                  style={{position:'absolute',top:`calc(50% + ${y}px)`,left:`calc(50% + ${x}px)`,
                    transform:'translate(-50%,-50%)',width:56,height:56,borderRadius:'50%',
                    background:'rgba(26,18,8,0.95)',border:`2px solid ${item.col}60`,
                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                    cursor:'pointer',transition:'all 0.2s',boxShadow:`0 0 12px ${item.col}20`}}
                  onMouseEnter={e=>{e.target.style.borderColor=item.col;e.target.style.boxShadow=`0 0 20px ${item.col}50`;e.target.style.transform='translate(-50%,-50%) scale(1.15)';}}
                  onMouseLeave={e=>{e.target.style.borderColor=item.col+'60';e.target.style.boxShadow=`0 0 12px ${item.col}20`;e.target.style.transform='translate(-50%,-50%) scale(1)';}}>
                  <span style={{fontSize:'1.2rem'}}>{item.icon}</span>
                  <span style={{fontSize:'0.5rem',color:item.col,fontWeight:700,fontFamily:'Georgia,serif'}}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* === NPC COMPANION (AI Messenger Drone) === */}
      {phase==='playing' && !activePanel && (
        <NPCCompanion
          playerStats={p}
          worldEvents={worldEvents}
          onlineCount={onlineCount}
        />
      )}

      {/* Floating radial trigger — small, unobtrusive */}
      {!activePanel && !showRadial && phase==='playing' && (
        <button onClick={()=>setShowRadial(true)}
          style={{position:'fixed',bottom:isMobile?75:16,right:16,width:44,height:44,borderRadius:'50%',
            background:'rgba(26,18,8,0.85)',border:'2px solid #5c4a2a',color:'#c9a84c',
            fontSize:'1.1rem',cursor:'pointer',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 2px 12px rgba(0,0,0,0.5)',backdropFilter:'blur(4px)'}}>
          🚀
        </button>
      )}

      {/* === IN-GAME PANELS === */}
      {activePanel==='missions'&&<MissionsPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='tasks'&&<TasksPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='empire'&&<EmpirePanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='research'&&<ResearchPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='skills'&&<SkillsPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='shop'&&<ShopPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='jobs'&&<JobsPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='tactics'&&<TacticsPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='ranks'&&<LeaderboardPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='social'&&<SocialPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='guilds'&&<GuildsPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='projects'&&<ProjectsPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='identity'&&<AvatarPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='ar'&&<ARPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='space'&&<SpacePanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='profile'&&<ProfilePanel onClose={()=>{setActivePanel(null);setPaused(false);}} onLogout={()=>{logout();nav('/login');}}/>}
      {activePanel==='nodes'&&<NodesPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='plugins'&&<PluginsPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
      {activePanel==='feed'&&<ActivityFeedPanel onClose={()=>{setActivePanel(null);setPaused(false);}}/>}
    </div>
  );
}
