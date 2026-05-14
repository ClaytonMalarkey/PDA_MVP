import { useState } from 'react';
import axios from 'axios';
import './AITaskAssistant.css';

const AITaskAssistant = ({ task, onComplete, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [assistance, setAssistance] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);

  const getAssistance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/ai/tasks/${task.taskId}/assist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssistance(response.data);
      setShowAssistant(true);
    } catch (error) {
      alert('Failed to get AI assistance: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = () => {
    if (onComplete) {
      onComplete();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="ai-task-assistant">
      {!showAssistant ? (
        <div className="ai-assistant-intro">
          <div className="ai-icon">🤖</div>
          <h3>AI Task Assistant</h3>
          <p>Get AI-powered guidance to help you complete this task</p>
          <button 
            className="btn btn-primary"
            onClick={getAssistance}
            disabled={loading}
          >
            {loading ? '⏳ Loading...' : '✨ Get AI Assistance'}
          </button>
        </div>
      ) : (
        <div className="ai-assistant-content">
          <div className="ai-header">
            <div className="ai-icon">🤖</div>
            <h3>AI Task Assistant</h3>
            <button 
              className="btn-close"
              onClick={() => setShowAssistant(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {assistance && (
            <>
              <div className="ai-section">
                <h4>📋 Task Overview</h4>
                <div className="task-info">
                  <strong>{assistance.title}</strong>
                  <p>{task.description}</p>
                </div>
              </div>

              {assistance.suggestions && assistance.suggestions.length > 0 && (
                <div className="ai-section">
                  <h4>💡 Suggestions</h4>
                  <ul className="suggestions-list">
                    {assistance.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {assistance.template && assistance.template.type === 'document' && (
                <div className="ai-section">
                  <h4>📝 Document Structure</h4>
                  <div className="template-sections">
                    {assistance.template.sections.map((section, index) => (
                      <div key={index} className="template-section">
                        <strong>{section.title}</strong>
                        <p>{section.description}</p>
                      </div>
                    ))}
                  </div>
                  
                  {assistance.template.example && (
                    <details className="template-example">
                      <summary>View Example Template</summary>
                      <pre>{assistance.template.example}</pre>
                    </details>
                  )}
                </div>
              )}

              {assistance.verificationCriteria && assistance.verificationCriteria.length > 0 && (
                <div className="ai-section">
                  <h4>✅ Completion Checklist</h4>
                  <ul className="criteria-list">
                    {assistance.verificationCriteria.map((criterion, index) => (
                      <li key={index}>{criterion}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="ai-section" style={{ borderLeft: '4px solid var(--secondary-color)' }}>
                <h4>📝 Next Steps</h4>
                <ol style={{ paddingLeft: '1.5rem', margin: '0' }}>
                  <li style={{ marginBottom: '0.5rem' }}>Review the guidance and suggestions above</li>
                  <li style={{ marginBottom: '0.5rem' }}>Complete the task in real life (write your constitution, create your design, etc.)</li>
                  <li style={{ marginBottom: '0.5rem' }}>Once you've finished, close this window</li>
                  <li>Click the "Complete" button to earn your rewards!</li>
                </ol>
              </div>

              <div className="ai-actions">
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleTaskComplete}
                >
                  ✅ I've Read the Guidance - Let Me Complete the Task
                </button>
                <p className="ai-disclaimer">
                  ℹ️ Follow the guidance above to complete your task, then click "Complete" on the task card
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AITaskAssistant;
