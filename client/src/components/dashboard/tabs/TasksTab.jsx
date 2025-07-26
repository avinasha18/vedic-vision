import React, { useState } from 'react';

const TasksTab = ({ tasks, onCreateTask, onToggleTaskStatus }) => {
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    deadline: '',
    maxScore: 100,
    type: 'assignment',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateTask(taskForm);
    setTaskForm({ title: '', description: '', deadline: '', maxScore: 100, type: 'assignment' });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Tasks Management</h2>
      
      {/* Create Task Form */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Task</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={taskForm.type}
              onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
              <option value="quiz">Quiz</option>
              <option value="presentation">Presentation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
            <input
              type="number"
              value={taskForm.maxScore}
              onChange={(e) => setTaskForm({ ...taskForm, maxScore: parseInt(e.target.value) })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              required
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="datetime-local"
              value={taskForm.deadline}
              onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>

      {/* Tasks List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Tasks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div key={task._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  task.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {task.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{task.description}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Type: {task.type}</p>
                <p>Deadline: {new Date(task.deadline).toLocaleDateString()}</p>
                <p>Max Score: {task.maxScore}</p>
              </div>
              <button
                onClick={() => onToggleTaskStatus(task._id)}
                className={`mt-3 w-full px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  task.isActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {task.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">No tasks found.</div>
        )}
      </div>
    </div>
  );
};

export default TasksTab; 