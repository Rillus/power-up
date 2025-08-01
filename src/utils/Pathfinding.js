/**
 * Simple A* pathfinding implementation for guest movement
 * @class Pathfinding
 */
export class Pathfinding {
  /**
   * Create a pathfinding instance
   * @param {number} gridSize - Size of each grid cell for pathfinding
   */
  constructor(gridSize = 40) {
    this.gridSize = gridSize;
    this.grid = [];
    this.gridWidth = 0;
    this.gridHeight = 0;
  }

  /**
   * Initialize the pathfinding grid based on game area
   * @param {number} gameWidth - Width of the game area
   * @param {number} gameHeight - Height of the game area
   */
  initializeGrid(gameWidth, gameHeight) {
    this.gridWidth = Math.ceil(gameWidth / this.gridSize);
    this.gridHeight = Math.ceil(gameHeight / this.gridSize);
    
    // Initialize grid with all cells walkable
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x] = {
          x,
          y,
          walkable: true,
          f: 0, // f = g + h
          g: 0, // cost from start
          h: 0, // heuristic cost to end
          parent: null
        };
      }
    }
  }

  /**
   * Mark obstacles on the grid (consoles, walls, other guests)
   * @param {Array} obstacles - Array of obstacle objects with x, y, width, height
   */
  updateObstacles(obstacles) {
    // Reset all cells to walkable first
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x].walkable = true;
      }
    }

    // Mark obstacles as unwalkable
    obstacles.forEach(obstacle => {
      const startX = Math.floor(obstacle.x / this.gridSize);
      const startY = Math.floor(obstacle.y / this.gridSize);
      const endX = Math.ceil((obstacle.x + obstacle.width) / this.gridSize);
      const endY = Math.ceil((obstacle.y + obstacle.height) / this.gridSize);

      for (let y = Math.max(0, startY); y < Math.min(this.gridHeight, endY); y++) {
        for (let x = Math.max(0, startX); x < Math.min(this.gridWidth, endX); x++) {
          this.grid[y][x].walkable = false;
        }
      }
    });
  }

  /**
   * Convert world position to grid coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Grid coordinates {x, y}
   */
  worldToGrid(worldX, worldY) {
    return {
      x: Math.floor(worldX / this.gridSize),
      y: Math.floor(worldY / this.gridSize)
    };
  }

  /**
   * Convert grid coordinates to world position
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {Object} World coordinates {x, y}
   */
  gridToWorld(gridX, gridY) {
    return {
      x: gridX * this.gridSize + this.gridSize / 2,
      y: gridY * this.gridSize + this.gridSize / 2
    };
  }

  /**
   * Calculate heuristic distance (Manhattan distance)
   * @param {Object} nodeA - First node
   * @param {Object} nodeB - Second node
   * @returns {number} Heuristic distance
   */
  heuristic(nodeA, nodeB) {
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
  }

  /**
   * Get neighboring nodes for a given node
   * @param {Object} node - Current node
   * @returns {Array} Array of walkable neighbor nodes
   */
  getNeighbors(node) {
    const neighbors = [];
    const directions = [
      {x: -1, y: 0},  // left
      {x: 1, y: 0},   // right
      {x: 0, y: -1},  // up
      {x: 0, y: 1},   // down
      {x: -1, y: -1}, // diagonal up-left
      {x: 1, y: -1},  // diagonal up-right
      {x: -1, y: 1},  // diagonal down-left
      {x: 1, y: 1}    // diagonal down-right
    ];

    directions.forEach(dir => {
      const newX = node.x + dir.x;
      const newY = node.y + dir.y;

      if (newX >= 0 && newX < this.gridWidth && 
          newY >= 0 && newY < this.gridHeight &&
          this.grid[newY][newX].walkable) {
        neighbors.push(this.grid[newY][newX]);
      }
    });

    return neighbors;
  }

  /**
   * Find path using A* algorithm
   * @param {number} startX - Start world X coordinate
   * @param {number} startY - Start world Y coordinate
   * @param {number} endX - End world X coordinate
   * @param {number} endY - End world Y coordinate
   * @returns {Array|null} Array of world coordinates representing the path, or null if no path found
   */
  findPath(startX, startY, endX, endY) {
    const startGrid = this.worldToGrid(startX, startY);
    const endGrid = this.worldToGrid(endX, endY);

    // Validate grid bounds
    if (startGrid.x < 0 || startGrid.x >= this.gridWidth ||
        startGrid.y < 0 || startGrid.y >= this.gridHeight ||
        endGrid.x < 0 || endGrid.x >= this.gridWidth ||
        endGrid.y < 0 || endGrid.y >= this.gridHeight) {
      return null;
    }

    const startNode = this.grid[startGrid.y][startGrid.x];
    let endNode = this.grid[endGrid.y][endGrid.x];

    // If end node is not walkable, find nearest walkable node
    if (!endNode.walkable) {
      const nearestWalkable = this.findNearestWalkableNode(endGrid.x, endGrid.y);
      if (!nearestWalkable) return null;
      endNode = nearestWalkable;
    }

    // Reset all nodes
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const node = this.grid[y][x];
        node.f = 0;
        node.g = 0;
        node.h = 0;
        node.parent = null;
      }
    }

    const openList = [];
    const closedList = [];

    openList.push(startNode);

    while (openList.length > 0) {
      // Find node with lowest f cost
      let currentNode = openList[0];
      let currentIndex = 0;

      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < currentNode.f) {
          currentNode = openList[i];
          currentIndex = i;
        }
      }

      // Move current node to closed list
      openList.splice(currentIndex, 1);
      closedList.push(currentNode);

      // If we reached the end, reconstruct path
      if (currentNode === endNode) {
        const path = [];
        let node = currentNode;
        
        while (node !== null) {
          const worldPos = this.gridToWorld(node.x, node.y);
          path.unshift(worldPos);
          node = node.parent;
        }
        
        return path;
      }

      // Check all neighbors
      const neighbors = this.getNeighbors(currentNode);
      
      for (const neighbor of neighbors) {
        // Skip if neighbor is in closed list
        if (closedList.includes(neighbor)) {
          continue;
        }

        // Calculate movement cost (diagonal costs more)
        const isDiagonal = Math.abs(neighbor.x - currentNode.x) === 1 && 
                          Math.abs(neighbor.y - currentNode.y) === 1;
        const movementCost = isDiagonal ? 1.4 : 1.0;
        const tentativeG = currentNode.g + movementCost;

        // If this path to neighbor is better than any previous one
        if (!openList.includes(neighbor)) {
          neighbor.g = tentativeG;
          neighbor.h = this.heuristic(neighbor, endNode);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = currentNode;
          openList.push(neighbor);
        } else if (tentativeG < neighbor.g) {
          neighbor.g = tentativeG;
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = currentNode;
        }
      }
    }

    // No path found
    return null;
  }

  /**
   * Find the nearest walkable node to a given position
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {Object|null} Nearest walkable node or null
   */
  findNearestWalkableNode(gridX, gridY) {
    const maxRadius = Math.max(this.gridWidth, this.gridHeight);
    
    for (let radius = 1; radius < maxRadius; radius++) {
      for (let x = Math.max(0, gridX - radius); x <= Math.min(this.gridWidth - 1, gridX + radius); x++) {
        for (let y = Math.max(0, gridY - radius); y <= Math.min(this.gridHeight - 1, gridY + radius); y++) {
          if (this.grid[y][x].walkable) {
            return this.grid[y][x];
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Simplify path by removing unnecessary waypoints
   * @param {Array} path - Original path array
   * @returns {Array} Simplified path array
   */
  simplifyPath(path) {
    if (path.length <= 2) return path;

    const simplified = [path[0]];
    
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];
      
      // Check if we can go directly from prev to next
      const directPath = this.hasDirectPath(prev.x, prev.y, next.x, next.y);
      
      if (!directPath) {
        simplified.push(current);
      }
    }
    
    simplified.push(path[path.length - 1]);
    return simplified;
  }

  /**
   * Check if there's a direct path between two points (no obstacles)
   * @param {number} x1 - Start X coordinate
   * @param {number} y1 - Start Y coordinate
   * @param {number} x2 - End X coordinate
   * @param {number} y2 - End Y coordinate
   * @returns {boolean} True if direct path exists
   */
  hasDirectPath(x1, y1, x2, y2) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(x1 + (x2 - x1) * t);
      const y = Math.round(y1 + (y2 - y1) * t);
      
      const gridPos = this.worldToGrid(x, y);
      
      if (gridPos.x < 0 || gridPos.x >= this.gridWidth ||
          gridPos.y < 0 || gridPos.y >= this.gridHeight ||
          !this.grid[gridPos.y][gridPos.x].walkable) {
        return false;
      }
    }
    
    return true;
  }
}