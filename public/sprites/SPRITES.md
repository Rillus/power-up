# Sprite System Documentation

## Overview
This document defines the sprite system for Power Up game, including file organization, naming conventions, and specifications.

## Directory Structure
```
public/sprites/
├── SPRITES.md (this file)
├── character/
│   ├── volunteer_idle_down.png (32x48px)
│   ├── volunteer_idle_up.png (32x48px)
│   ├── volunteer_idle_left.png (32x48px)
│   ├── volunteer_idle_right.png (32x48px)
│   ├── volunteer_walk_down_01.png (32x48px)
│   ├── volunteer_walk_down_02.png (32x48px)
│   ├── volunteer_walk_up_01.png (32x48px)
│   ├── volunteer_walk_up_02.png (32x48px)
│   ├── volunteer_walk_left_01.png (32x48px)
│   ├── volunteer_walk_left_02.png (32x48px)
│   ├── volunteer_walk_right_01.png (32x48px)
│   ├── volunteer_walk_right_02.png (32x48px)
│   └── volunteer_repair.png (32x48px)
├── consoles/
│   ├── retro_arcade_tier1.png (64x64px)
│   ├── retro_arcade_tier2.png (64x64px)
│   ├── retro_arcade_tier3.png (64x64px)
│   ├── retro_arcade_tier1_broken.png (64x64px)
│   ├── retro_arcade_tier2_broken.png (64x64px)
│   ├── retro_arcade_tier3_broken.png (64x64px)
│   ├── classic_home_tier1.png (64x64px)
│   ├── classic_home_tier2.png (64x64px)
│   ├── classic_home_tier3.png (64x64px)
│   ├── classic_home_tier1_broken.png (64x64px)
│   ├── classic_home_tier2_broken.png (64x64px)
│   ├── classic_home_tier3_broken.png (64x64px)
│   ├── modern_gaming_tier1.png (64x64px)
│   ├── modern_gaming_tier2.png (64x64px)
│   ├── modern_gaming_tier3.png (64x64px)
│   ├── modern_gaming_tier1_broken.png (64x64px)
│   ├── modern_gaming_tier2_broken.png (64x64px)
│   ├── modern_gaming_tier3_broken.png (64x64px)
│   ├── vr_experience_tier1.png (64x64px)
│   ├── vr_experience_tier2.png (64x64px)
│   ├── vr_experience_tier3.png (64x64px)
│   ├── vr_experience_tier1_broken.png (64x64px)
│   ├── vr_experience_tier2_broken.png (64x64px)
│   └── vr_experience_tier3_broken.png (64x64px)
├── guests/
│   ├── casual_family_01.png (24x32px)
│   ├── casual_family_02.png (24x32px)
│   ├── enthusiast_gamer.png (24x32px)
│   └── school_group.png (24x32px)
├── powerups/
│   ├── speed_boost.png (32x32px)
│   ├── repair_master.png (32x32px)
│   ├── guest_magnet.png (32x32px)
│   └── money_multiplier.png (32x32px)
└── ui/
    ├── icons/
    └── buttons/
```

## Sprite Specifications

### Character Sprites (32x48px)
**Idle Poses (4 directions):**
- **volunteer_idle_down.png**: Facing down (default)
- **volunteer_idle_up.png**: Facing up
- **volunteer_idle_left.png**: Facing left
- **volunteer_idle_right.png**: Facing right

**Walking Animation (4 directions, 2 frames each):**
- **volunteer_walk_down_01.png**: Walking down, frame 1
- **volunteer_walk_down_02.png**: Walking down, frame 2
- **volunteer_walk_up_01.png**: Walking up, frame 1
- **volunteer_walk_up_02.png**: Walking up, frame 2
- **volunteer_walk_left_01.png**: Walking left, frame 1
- **volunteer_walk_left_02.png**: Walking left, frame 2
- **volunteer_walk_right_01.png**: Walking right, frame 1
- **volunteer_walk_right_02.png**: Walking right, frame 2

**Special Actions:**
- **volunteer_repair.png**: Repairing console pose (direction-neutral)

### Console Sprites (64x64px)
Four console types, each with 3 upgrade tiers:
- **Retro Arcade**: retro_arcade_tier[1-3].png
- **Classic Home**: classic_home_tier[1-3].png  
- **Modern Gaming**: modern_gaming_tier[1-3].png
- **VR Experience**: vr_experience_tier[1-3].png

### Guest Sprites (24x32px)
Three guest types based on demographics:
- **Casual Families** (60%): casual_family_01.png, casual_family_02.png
- **Enthusiast Gamers** (25%): enthusiast_gamer.png
- **School Groups** (15%): school_group.png

### Console Sprites (64x64px)
Four console types with three tiers each, plus broken states:

**Retro Arcade:**
- retro_arcade_tier1.png (working state)
- retro_arcade_tier1_broken.png (broken state - needs repair)
- retro_arcade_tier2.png / retro_arcade_tier2_broken.png
- retro_arcade_tier3.png / retro_arcade_tier3_broken.png

**Classic Home:**
- classic_home_tier1.png / classic_home_tier1_broken.png
- classic_home_tier2.png / classic_home_tier2_broken.png  
- classic_home_tier3.png / classic_home_tier3_broken.png

**Modern Gaming:**
- modern_gaming_tier1.png / modern_gaming_tier1_broken.png
- modern_gaming_tier2.png / modern_gaming_tier2_broken.png
- modern_gaming_tier3.png / modern_gaming_tier3_broken.png

**VR Experience:**
- vr_experience_tier1.png / vr_experience_tier1_broken.png
- vr_experience_tier2.png / vr_experience_tier2_broken.png
- vr_experience_tier3.png / vr_experience_tier3_broken.png

**Broken State Visual Guidelines:**
- Darker color palette with red warning indicators
- Sparks or smoke effects if possible
- "!" warning symbol or similar distress indicators
- Maintain console silhouette but show obvious malfunction

### Power-Up Sprites (32x32px)
Four temporary boost types:
- **Speed Boost**: speed_boost.png
- **Repair Master**: repair_master.png
- **Guest Magnet**: guest_magnet.png
- **Money Multiplier**: money_multiplier.png

## Color Palette
Based on Science Museum branding:
- Primary Blue: #0066CC
- White: #FFFFFF
- Light Gray: #F5F5F5
- Dark Gray: #333333
- Accent Green: #00AA44 (for positive feedback)
- Accent Red: #CC0000 (for negative feedback)

## File Format Standards
- **Format**: PNG with transparency
- **Compression**: Optimized for web (use tools like TinyPNG)
- **Naming**: lowercase_with_underscores.png
- **Background**: Transparent for all sprites

## Loading System
Sprites are loaded via the SpriteLoader utility:
```javascript
// Example usage
const spriteLoader = new SpriteLoader();
await spriteLoader.loadSprite('character', 'volunteer_idle');
const sprite = spriteLoader.getSprite('character', 'volunteer_idle');
```

## Animation System
- **Character walking**: 2-frame cycle at 4 FPS per direction (down, up, left, right)
- **Character idle**: Direction-specific idle poses
- **Direction detection**: Based on movement input (WASD or arrow keys)
- **Console states**: Static sprites that change based on tier/condition
- **Power-ups**: Optional gentle pulsing effect via code
- **Guests**: Static sprites with occasional direction changes