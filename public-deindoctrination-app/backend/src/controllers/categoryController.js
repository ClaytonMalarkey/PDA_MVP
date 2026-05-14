const Category = require('../models/Category');
const Task = require('../models/Task');

// Get all categories (admin)
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    // Get task count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const taskCount = await Task.countDocuments({ 
          category: category.name, 
          isActive: true 
        });
        
        return {
          ...category.toObject(),
          taskCount
        };
      })
    );

    res.json(categoriesWithCount);
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get active categories (public)
const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name description icon color')
      .sort({ name: 1 });
    
    res.json(categories);
  } catch (error) {
    console.error('Get active categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;

    // Validate required fields
    if (!name || name.trim().length < 3 || name.trim().length > 50) {
      return res.status(400).json({ 
        error: 'Category name must be between 3 and 50 characters' 
      });
    }

    // Check for duplicate
    const existing = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existing) {
      return res.status(400).json({ 
        error: 'Category with this name already exists' 
      });
    }

    // Create category
    const category = new Category({
      name: name.trim(),
      description: description?.trim() || '',
      icon: icon || '📁',
      color: color || '#6366f1'
    });

    await category.save();
    
    res.status(201).json({
      ...category.toObject(),
      taskCount: 0
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Category with this name already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // If deactivating, check if has tasks
    if (isActive === false && category.isActive === true) {
      const taskCount = await Task.countDocuments({ 
        category: category.name, 
        isActive: true 
      });
      
      if (taskCount > 0) {
        return res.status(400).json({ 
          error: `Cannot deactivate category with ${taskCount} active tasks. Please reassign or delete tasks first.` 
        });
      }
    }

    // If changing name, check for duplicates
    if (name && name !== category.name) {
      const existing = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existing) {
        return res.status(400).json({ 
          error: 'Category with this name already exists' 
        });
      }

      // Update all tasks with old category name
      await Task.updateMany(
        { category: category.name },
        { category: name.trim() }
      );
    }

    // Update category
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    // Get task count
    const taskCount = await Task.countDocuments({ 
      category: category.name, 
      isActive: true 
    });

    res.json({
      ...category.toObject(),
      taskCount
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Category with this name already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// Delete category (soft delete)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if has tasks
    const taskCount = await Task.countDocuments({ 
      category: category.name, 
      isActive: true 
    });
    
    if (taskCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category with ${taskCount} active tasks. Please reassign or delete tasks first.` 
      });
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    res.json({ 
      message: 'Category deleted successfully',
      category: {
        ...category.toObject(),
        taskCount: 0
      }
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

module.exports = {
  getAllCategories,
  getActiveCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
