import { useState, useEffect } from 'react';
import axios from 'axios';

const EMOJI_OPTIONS = [
  '📁', '🧠', '📰', '❤️', '🏛️', '💪', '🏃', '📚', '🎨', '🔬',
  '💼', '🌍', '🎯', '⚡', '🔥', '💡', '🎓', '🏆', '🌟', '✨',
  '🚀', '💻', '📱', '🎮', '🎵', '🎬', '📷', '🍎', '🌱', '🔧'
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: '#6366f1'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      alert('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`/api/admin/categories/${editingCategory._id}`, formData);
        alert('Category updated successfully!');
      } else {
        await axios.post('/api/admin/categories', formData);
        alert('Category created successfully!');
      }
      resetForm();
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '📁',
      color: category.color || '#6366f1',
      isActive: category.isActive
    });
    setIsCreating(true);
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"?`)) return;
    
    try {
      await axios.delete(`/api/admin/categories/${categoryId}`);
      alert('Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete category');
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await axios.put(`/api/admin/categories/${category._id}`, {
        ...category,
        isActive: !category.isActive
      });
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update category status');
    }
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingCategory(null);
    setShowIconPicker(false);
    setFormData({
      name: '',
      description: '',
      icon: '📁',
      color: '#6366f1'
    });
  };

  const handleIconSelect = (icon) => {
    setFormData({ ...formData, icon });
    setShowIconPicker(false);
  };

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // For now, we'll use the file name as the icon
        // In a production app, you'd upload to a server and get a URL
        setFormData({ ...formData, icon: file.name.substring(0, 2) });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading categories...</div>;
  }

  return (
    <div>
      <div className="admin-table-header">
        <div>
          <h2>Manage Categories</h2>
          <p>Create and organize task categories</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancel' : '+ Create Category'}
        </button>
      </div>

      {isCreating && (
        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ marginBottom: '1rem' }}>
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Name *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="e.g., Critical Thinking"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Icon
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ 
                    width: '60px', 
                    height: '40px', 
                    border: '2px solid var(--border-color)', 
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    background: 'var(--surface-color)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  title="Click to choose icon"
                  >
                    {formData.icon}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    style={{ flex: 1 }}
                  >
                    Choose Icon
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    style={{ display: 'none' }}
                    id="icon-upload"
                  />
                  <label 
                    htmlFor="icon-upload" 
                    className="btn btn-secondary"
                    style={{ margin: 0, cursor: 'pointer' }}
                  >
                    Upload
                  </label>
                </div>
                
                {showIconPicker && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    background: 'var(--background-color)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(10, 1fr)',
                    gap: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleIconSelect(emoji)}
                        style={{
                          fontSize: '1.5rem',
                          padding: '0.5rem',
                          border: formData.icon === emoji ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                          borderRadius: '0.375rem',
                          background: formData.icon === emoji ? 'var(--primary-color-light)' : 'var(--surface-color)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (formData.icon !== emoji) {
                            e.target.style.background = 'var(--hover-color)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.icon !== emoji) {
                            e.target.style.background = 'var(--surface-color)';
                          }
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Color
                </label>
                <input
                  type="color"
                  className="input"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{ height: '40px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Description
              </label>
              <textarea
                className="input"
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={200}
                placeholder="Brief description of this category"
              />
            </div>

            {editingCategory && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
              <button type="button" className="btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table">
        <div className="admin-table-content">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Tasks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map(category => (
                  <tr key={category._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
                        <div>
                          <strong>{category.name}</strong>
                          {category.isDefault && (
                            <span style={{ 
                              marginLeft: '0.5rem', 
                              fontSize: '0.75rem', 
                              padding: '0.125rem 0.375rem', 
                              background: 'var(--secondary-color)', 
                              color: 'white', 
                              borderRadius: '0.25rem' 
                            }}>
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <small style={{ color: 'var(--text-light)' }}>
                        {category.description || 'No description'}
                      </small>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        background: 'var(--background-color)', 
                        borderRadius: '0.25rem',
                        fontWeight: '500'
                      }}>
                        {category.taskCount || 0} tasks
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(category)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: category.isActive ? 'var(--secondary-color)' : 'var(--text-light)',
                          fontSize: '0.875rem',
                          padding: '0.25rem 0.5rem'
                        }}
                      >
                        {category.isActive ? '● Active' : '○ Inactive'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-icon btn-secondary"
                          onClick={() => handleEdit(category)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-icon btn-danger"
                          onClick={() => handleDelete(category._id, category.name)}
                          disabled={category.taskCount > 0}
                          title={category.taskCount > 0 ? 'Cannot delete category with tasks' : 'Delete category'}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    No categories found. Create your first category!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Categories;

