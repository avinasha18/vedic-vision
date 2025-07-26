import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { taskAPI, attendanceAPI, submissionAPI, announcementAPI } from '../../services/api';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: null, taskId: null });

  // Form states
  const [submissionForm, setSubmissionForm] = useState({
    description: '',
    link: '',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksRes, attendanceRes, submissionsRes, announcementsRes] = await Promise.all([
        taskAPI.getAllTasks(),
        attendanceAPI.getMyAttendance(),
        submissionAPI.getMySubmissions(),
        announcementAPI.getAllAnnouncements(),
      ]);

      setTasks(tasksRes.data.data.tasks || []);
      setAttendance(attendanceRes.data.data.attendance || []);
      setSubmissions(submissionsRes.data.data.submissions || []);
      setAnnouncements(announcementsRes.data.data.announcements || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showSuccessModal('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const showSuccessModal = (title, message) => {
    setModalContent({
      title,
      content: (
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600">{message}</p>
        </div>
      )
    });
    setShowModal(true);
  };

  // Calculate attendance statistics
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const handleSubmitTask = async (taskId) => {
    try {
      // Validate that at least one submission content is provided
      if (!submissionForm.description && !submissionForm.link) {
        showSuccessModal('Error', 'Please provide a description or link for your submission');
        return;
      }

      const formData = new FormData();
      formData.append('taskId', taskId.toString());
      
      // Determine submission type and content
      let submissionType = 'text';
      let content = { text: submissionForm.description || 'No description provided' };
      
      if (submissionForm.link) {
        submissionType = 'link';
        content = { link: submissionForm.link };
      } else {
        // Text-only submission
        submissionType = 'text';
        content = { text: submissionForm.description || 'Text submission' };
      }
      
      formData.append('submissionType', submissionType);
      formData.append('content', JSON.stringify(content));
      
      // Ensure content is not empty
      if (!submissionForm.description && !submissionForm.link) {
        showSuccessModal('Error', 'Please provide a description or link for your submission');
        return;
      }

      // Debug: Log form data
      console.log('Submitting task:', taskId);
      console.log('Form data:', {
        taskId,
        submissionType,
        content
      });
      
      // Log the actual FormData entries
      for (let [key, value] of formData.entries()) {
        console.log('FormData entry:', key, value);
      }

      await submissionAPI.submitTask(taskId, formData);
      showSuccessModal('Success', 'Task submitted successfully!');
      setSubmissionForm({ description: '', link: '' });
      setShowModal(false);
      loadDashboardData();
    } catch (error) {
      let errorMessage = 'Failed to submit task';
      if (error.response?.data?.message) {
        errorMessage += ': ' + error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage += ': ' + error.response.data.errors.map(e => e.msg).join(', ');
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      showSuccessModal('Error', errorMessage);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'tasks', name: 'Tasks', icon: '📝' },
    { id: 'attendance', name: 'Attendance', icon: '✅' },
    { id: 'submissions', name: 'My Submissions', icon: '📤' },
    { id: 'announcements', name: 'Announcements', icon: '📢' },
  ];

  const activeTasks = tasks.filter(t => t.isActive);
  const completedSubmissions = submissions.filter(s => s.score);
  const pendingSubmissions = submissions.filter(s => !s.score);
  const todayAttendance = attendance.filter(a => 
    new Date(a.date).toDateString() === new Date().toDateString()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Participant Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}!</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{activeTasks.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{attendancePercentage}%</p>
                      <p className="text-xs text-gray-500">{presentDays}/{totalDays} days</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Submissions</p>
                      <p className="text-2xl font-bold text-gray-900">{pendingSubmissions.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{completedSubmissions.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center transition-colors"
                  >
                    <div className="text-2xl mb-2">📊</div>
                    <div className="font-medium">View Attendance</div>
                    <div className="text-sm opacity-90">Check your attendance history</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition-colors"
                  >
                    <div className="text-2xl mb-2">📝</div>
                    <div className="font-medium">View Tasks</div>
                    <div className="text-sm opacity-90">Check available tasks and deadlines</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Tasks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTasks.map((task) => {
                  const submission = submissions.find(s => s.taskId === task._id);
                  const isSubmitted = !!submission;
                  const isGraded = submission?.score;

                  return (
                    <div key={task._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          isGraded ? 'bg-green-100 text-green-800' :
                          isSubmitted ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {isGraded ? 'Graded' : isSubmitted ? 'Submitted' : 'Active'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                      <div className="text-xs text-gray-500 space-y-1 mb-3">
                        <p>Type: {task.type}</p>
                        <p>Deadline: {new Date(task.deadline).toLocaleDateString()}</p>
                        <p>Max Score: {task.maxScore}</p>
                        {isGraded && <p className="text-green-600 font-medium">Score: {submission.score}</p>}
                      </div>
                      
                                             {!isSubmitted && (
                         <button
                                                       onClick={() => {
                              setSubmissionForm({ description: '', link: '' });
                             setModalContent({
                               title: `Submit Task: ${task.title}`,
                               content: null, // We'll render the form directly in the modal
                               taskId: task._id
                             });
                             setShowModal(true);
                           }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Submit Task
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {activeTasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">No active tasks available.</div>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance History</h2>
              <div className="mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Attendance Summary</h3>
                      <p className="text-sm text-gray-600">Your attendance statistics</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">{attendancePercentage}%</p>
                      <p className="text-sm text-gray-500">{presentDays} of {totalDays} days</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendance.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.session || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {attendance.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No attendance records found.</div>
                )}
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Submissions</h2>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission._id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">Task: {submission.taskId?.title || 'Unknown Task'}</h4>
                        <p className="text-xs text-gray-500">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          submission.score ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.score ? `Score: ${submission.score}` : 'Not graded'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-700">
                        {submission.content?.text || submission.description || 'No description'}
                      </p>
                      {submission.content?.fileUrl && (
                        <a href={submission.content.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                          📎 Download File
                        </a>
                      )}
                      {submission.content?.link && (
                        <a href={submission.content.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm ml-2">
                          🔗 View Link
                        </a>
                      )}
                    </div>

                    {submission.feedback && (
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-gray-700"><strong>Feedback:</strong> {submission.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
                {submissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No submissions found.</div>
                )}
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Announcements</h2>
              <div className="space-y-4">
                {announcements.filter(a => a.isActive).map((announcement) => (
                  <div key={announcement._id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                        <p className="text-sm text-gray-600">{announcement.content}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        announcement.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        announcement.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {announcement.priority}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Posted: {new Date(announcement.createdAt).toLocaleDateString()}</p>
                      {announcement.expiresAt && (
                        <p>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
                {announcements.filter(a => a.isActive).length === 0 && (
                  <div className="text-center py-8 text-gray-500">No active announcements.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalContent.title}
      >
        {modalContent.content || (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={submissionForm.description}
                onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your submission or provide details about your work..."
                required
              />
                             <p className="text-xs text-gray-500 mt-1">Provide a description or link (at least one is required)</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
              <input
                type="url"
                value={submissionForm.link}
                onChange={(e) => setSubmissionForm({ ...submissionForm, link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  handleSubmitTask(modalContent.taskId);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Submit Task
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParticipantDashboard; 