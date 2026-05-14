const Category = require('../models/Category');

/**
 * Metadata for all 10 new categories with icons and colors
 * Icons are emoji characters, colors are hex codes
 */
const CATEGORY_METADATA = {
  'Spiritual': { icon: '🙏', color: '#9333ea' },
  'Creative': { icon: '🎨', color: '#ec4899' },
  'Fitness': { icon: '💪', color: '#ef4444' },
  'Exploration': { icon: '🚀', color: '#3b82f6' },
  'Governance': { icon: '⚖️', color: '#8b5cf6' },
  'Engineering': { icon: '⚙️', color: '#6366f1' },
  'Education': { icon: '📚', color: '#10b981' },
  'Survival': { icon: '🌱', color: '#84cc16' },
  'Social': { icon: '👥', color: '#06b6d4' },
  'Innovation': { icon: '💡', color: '#f59e0b' }
};

/**
 * Ensures a category exists in the database, creating it if necessary
 * Reuses existing categories without creating duplicates
 * 
 * @param {string} categoryName - The name of the category to ensure exists
 * @returns {Promise<Object>} The category document
 */
async function ensureCategory(categoryName) {
  // Check if category already exists
  let category = await Category.findOne({ name: categoryName });
  
  if (category) {
    // Category exists, reuse it
    return category;
  }
  
  // Category doesn't exist, create it
  const metadata = CATEGORY_METADATA[categoryName] || {
    icon: '📁',
    color: '#6366f1'
  };
  
  category = await Category.create({
    name: categoryName,
    icon: metadata.icon,
    color: metadata.color,
    isActive: true,
    isDefault: false
  });
  
  return category;
}

/**
 * Ensures all categories in the provided list exist in the database
 * Creates missing categories in batch for efficiency
 * 
 * @param {Array<string>} categoryNames - Array of category names to ensure exist
 * @returns {Promise<Map<string, Object>>} Map of category name to category document
 */
async function ensureAllCategories(categoryNames) {
  const categoryMap = new Map();
  
  // Get unique category names
  const uniqueNames = [...new Set(categoryNames)];
  
  // Check which categories already exist
  const existingCategories = await Category.find({
    name: { $in: uniqueNames }
  });
  
  // Add existing categories to map
  existingCategories.forEach(cat => {
    categoryMap.set(cat.name, cat);
  });
  
  // Determine which categories need to be created
  const existingNames = new Set(existingCategories.map(cat => cat.name));
  const categoriesToCreate = uniqueNames.filter(name => !existingNames.has(name));
  
  // Create missing categories
  if (categoriesToCreate.length > 0) {
    const newCategories = categoriesToCreate.map(name => {
      const metadata = CATEGORY_METADATA[name] || {
        icon: '📁',
        color: '#6366f1'
      };
      
      return {
        name,
        icon: metadata.icon,
        color: metadata.color,
        isActive: true,
        isDefault: false
      };
    });
    
    const createdCategories = await Category.insertMany(newCategories);
    
    // Add newly created categories to map
    createdCategories.forEach(cat => {
      categoryMap.set(cat.name, cat);
    });
  }
  
  return categoryMap;
}

module.exports = {
  CATEGORY_METADATA,
  ensureCategory,
  ensureAllCategories
};
