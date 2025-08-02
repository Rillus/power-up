/**
 * SpriteLoader - Utility class for loading and managing game sprites
 * Handles async loading, caching, and sprite retrieval for the Power Up game
 */
export class SpriteLoader {
    constructor() {
        this.sprites = new Map();
        this.loadingPromises = new Map();
        this.basePath = '/sprites/';
    }

    /**
     * Load a sprite from the specified category and filename
     * @param {string} category - Sprite category (character, consoles, guests, powerups)
     * @param {string} filename - Sprite filename without extension
     * @returns {Promise<HTMLImageElement>} Promise that resolves to loaded image
     */
    async loadSprite(category, filename) {
        const key = `${category}/${filename}`;
        
        // Return cached sprite if already loaded
        if (this.sprites.has(key)) {
            return this.sprites.get(key);
        }

        // Return existing promise if already loading
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key);
        }

        // Create new loading promise
        const loadPromise = this._loadImage(`${this.basePath}${category}/${filename}.png`);
        this.loadingPromises.set(key, loadPromise);

        try {
            const image = await loadPromise;
            this.sprites.set(key, image);
            this.loadingPromises.delete(key);
            return image;
        } catch (error) {
            this.loadingPromises.delete(key);
            console.error(`Failed to load sprite: ${key}`, error);
            throw error;
        }
    }

    /**
     * Get a cached sprite (must be loaded first)
     * @param {string} category - Sprite category
     * @param {string} filename - Sprite filename without extension
     * @returns {HTMLImageElement|null} Cached image or null if not loaded
     */
    getSprite(category, filename) {
        const key = `${category}/${filename}`;
        return this.sprites.get(key) || null;
    }

    /**
     * Preload multiple sprites from a category
     * @param {string} category - Sprite category
     * @param {string[]} filenames - Array of sprite filenames without extensions
     * @returns {Promise<HTMLImageElement[]>} Promise that resolves to array of loaded images
     */
    async preloadCategory(category, filenames) {
        const loadPromises = filenames.map(filename => 
            this.loadSprite(category, filename)
        );
        return Promise.all(loadPromises);
    }

    /**
     * Preload all essential game sprites
     * @returns {Promise<void>} Promise that resolves when all sprites are loaded
     */
    async preloadEssentialSprites() {
        const spriteManifest = {
            character: [
                'volunteer_idle_down',
                'volunteer_idle_up',
                'volunteer_idle_left',
                'volunteer_idle_right',
                'volunteer_walk_down_01',
                'volunteer_walk_down_02',
                'volunteer_walk_up_01',
                'volunteer_walk_up_02',
                'volunteer_walk_left_01',
                'volunteer_walk_left_02',
                'volunteer_walk_right_01',
                'volunteer_walk_right_02',
                'volunteer_repair'
            ],
            consoles: [
                'retro_arcade_tier1',
                'retro_arcade_tier1_broken',
                'retro_arcade_tier2', 
                'retro_arcade_tier2_broken',
                'retro_arcade_tier3',
                'retro_arcade_tier3_broken',
                'classic_home_tier1',
                'classic_home_tier1_broken',
                'classic_home_tier2',
                'classic_home_tier2_broken',
                'classic_home_tier3',
                'classic_home_tier3_broken',
                'modern_gaming_tier1',
                'modern_gaming_tier1_broken',
                'modern_gaming_tier2', 
                'modern_gaming_tier2_broken',
                'modern_gaming_tier3',
                'modern_gaming_tier3_broken',
                'vr_experience_tier1',
                'vr_experience_tier1_broken',
                'vr_experience_tier2',
                'vr_experience_tier2_broken',
                'vr_experience_tier3',
                'vr_experience_tier3_broken'
            ],
            guests: [
                'casual_family_01',
                'casual_family_02',
                'enthusiast_gamer',
                'school_group'
            ],
            powerups: [
                'speed_boost',
                'repair_master',
                'guest_magnet',
                'money_multiplier'
            ]
        };

        const allLoadPromises = [];
        for (const [category, filenames] of Object.entries(spriteManifest)) {
            allLoadPromises.push(this.preloadCategory(category, filenames));
        }

        await Promise.all(allLoadPromises);
        console.log('All essential sprites loaded successfully');
    }

    /**
     * Check if a sprite is loaded
     * @param {string} category - Sprite category
     * @param {string} filename - Sprite filename without extension
     * @returns {boolean} True if sprite is loaded
     */
    isLoaded(category, filename) {
        const key = `${category}/${filename}`;
        return this.sprites.has(key);
    }

    /**
     * Get loading progress (0-1)
     * @returns {number} Loading progress as decimal
     */
    getLoadingProgress() {
        const totalSprites = this.sprites.size + this.loadingPromises.size;
        if (totalSprites === 0) return 0;
        return this.sprites.size / totalSprites;
    }

    /**
     * Clear all cached sprites (useful for memory management)
     */
    clearCache() {
        this.sprites.clear();
        console.log('Sprite cache cleared');
    }

    /**
     * Private method to load an image
     * @param {string} src - Image source URL
     * @returns {Promise<HTMLImageElement>} Promise that resolves to loaded image
     */
    _loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                console.log(`Sprite loaded: ${src}`);
                resolve(img);
            };
            
            img.onerror = (error) => {
                console.error(`Failed to load sprite: ${src}`, error);
                reject(new Error(`Failed to load sprite: ${src}`));
            };
            
            img.src = src;
        });
    }

    /**
     * Get sprite dimensions without loading
     * @param {string} category - Sprite category
     * @returns {Object} Dimensions object {width, height}
     */
    getSpriteDimensions(category) {
        const dimensions = {
            character: { width: 32, height: 48 },
            consoles: { width: 64, height: 64 },
            guests: { width: 24, height: 32 },
            powerups: { width: 32, height: 32 }
        };
        
        return dimensions[category] || { width: 32, height: 32 };
    }
}

// Export singleton instance for global use
export const spriteLoader = new SpriteLoader();