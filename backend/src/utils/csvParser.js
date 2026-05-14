const fs = require('fs');
const { parse } = require('csv-parse/sync');

/**
 * Parses a CSV file and returns an array of TaskRow objects.
 * 
 * @param {string} filePath - Absolute path to the CSV file
 * @returns {Array<TaskRow>} Array of parsed task objects
 * @throws {Error} If file not found or invalid CSV format
 * 
 * TaskRow structure:
 * {
 *   taskId: string,
 *   taskName: string,
 *   taskCategory: string,
 *   taskDescription: string,
 *   taskCheck: string,
 *   taskVirtualReward: string,
 *   taskRealReward: string
 * }
 */
function parseCSV(filePath) {
  try {
    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Parse CSV with csv-parse library
    // Configuration:
    // - columns: true - Use first row as column names (auto-skip header)
    // - skip_empty_lines: true - Ignore empty lines
    // - trim: true - Trim whitespace from fields
    // - relax_quotes: true - Handle quoted fields with commas
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true
    });
    
    // Map CSV columns to TaskRow structure
    const taskRows = records.map(record => ({
      taskId: record['Task ID'],
      taskName: record['Task Name'],
      taskCategory: record['Task Category'],
      taskDescription: record['Task Description'],
      taskCheck: record['Task Check'],
      taskVirtualReward: record['Task Virtual Reward'],
      taskRealReward: record['Task Real Reward']
    }));
    
    return taskRows;
    
  } catch (error) {
    // Handle file not found error
    if (error.code === 'ENOENT') {
      throw new Error(`CSV file not found: ${filePath}`);
    }
    
    // Handle CSV parsing errors
    if (error.message && error.message.includes('Invalid')) {
      throw new Error(`Invalid CSV format: ${error.message}`);
    }
    
    // Re-throw other errors
    throw error;
  }
}

module.exports = {
  parseCSV
};
