import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, taskAPI, attendanceAPI, submissionAPI, announcementAPI, exportAPI } from '../../services/api';
import RegisterAdmin from '../admin/RegisterAdmin';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';

// Import tab components
import OverviewTab from './tabs/OverviewTab';
import UsersTab from './tabs/UsersTab';
import TasksTab from './tabs/TasksTab';
import AttendanceTab from './tabs/AttendanceTab';
import SubmissionsTab from './tabs/SubmissionsTab';
import AnnouncementsTab from './tabs/AnnouncementsTab';
import ExportsTab from './tabs/ExportsTab';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: null });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load users with default pagination for initial load
      const [usersRes, tasksRes, attendanceRes, submissionsRes, announcementsRes] = await Promise.all([
        userAPI.getAllUsers({ page: 1, limit: 10 }),
        taskAPI.getAllTasks(),
        attendanceAPI.getAllAttendance(),
        submissionAPI.getAllSubmissions(),
        announcementAPI.getAllAnnouncements(),
      ]);

      setUsers(usersRes.data.data.users || []);
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

  // Function to load users with params for UsersTab
  const handleLoadUsers = async (params) => {
    const res = await userAPI.getAllUsers(params);
    setUsers(res.data.data.users || []);
    return { data: res.data.data };
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

  const handleCreateTask = async (taskForm) => {
    try {
      await taskAPI.createTask(taskForm);
      showSuccessModal('Success', 'Task created successfully!');
      loadDashboardData();
    } catch (error) {
      showSuccessModal('Error', 'Failed to create task: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreateAnnouncement = async (announcementForm) => {
    try {
      const announcementData = {
        title: announcementForm.title,
        content: announcementForm.content,
        priority: announcementForm.priority,
        targetAudience: announcementForm.targetAudience
      };
      
      if (announcementForm.expiresAt) {
        announcementData.expiresAt = announcementForm.expiresAt;
      }
      
      await announcementAPI.createAnnouncement(announcementData);
      showSuccessModal('Success', 'Announcement created successfully!');
      loadDashboardData();
    } catch (error) {
      showSuccessModal('Error', 'Failed to create announcement: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleGradeSubmission = async (submissionId, gradingForm) => {
    try {
      await submissionAPI.gradeSubmission(submissionId, gradingForm);
      showSuccessModal('Success', 'Submission graded successfully!');
      loadDashboardData();
    } catch (error) {
      showSuccessModal('Error', 'Failed to grade submission: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleTaskStatus = async (taskId) => {
    try {
      await taskAPI.toggleTaskStatus(taskId);
      loadDashboardData();
    } catch (error) {
      showSuccessModal('Error', 'Failed to toggle task status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await announcementAPI.deleteAnnouncement(announcementId);
        showSuccessModal('Success', 'Announcement deleted successfully!');
        loadDashboardData();
      } catch (error) {
        showSuccessModal('Error', 'Failed to delete announcement: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleExportData = async (type) => {
    try {
      let response;
      switch (type) {
        case 'attendance':
          response = await exportAPI.exportAttendance();
          break;
        case 'submissions':
          response = await exportAPI.exportSubmissions();
          break;
        case 'scores':
          response = await exportAPI.exportScores();
          break;
        default:
          return;
      }
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showSuccessModal('Success', `${type} data exported successfully!`);
    } catch (error) {
      showSuccessModal('Error', 'Failed to export data: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'tasks', name: 'Tasks', icon: '📝' },
    { id: 'attendance', name: 'Attendance', icon: '✅' },
    { id: 'submissions', name: 'Submissions', icon: '📤' },
    { id: 'announcements', name: 'Announcements', icon: '📢' },
    { id: 'exports', name: 'Exports', icon: '📥' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab users={users} tasks={tasks} attendance={attendance} submissions={submissions} />;
      case 'users':
        return <UsersTab users={users} onLoadUsers={handleLoadUsers} />;
      case 'tasks':
        return <TasksTab tasks={tasks} onCreateTask={handleCreateTask} onToggleTaskStatus={handleToggleTaskStatus} />;
      case 'attendance':
        return <AttendanceTab attendance={attendance} onMarkAttendance={loadDashboardData} />;
      case 'submissions':
        return <SubmissionsTab submissions={submissions} onGradeSubmission={handleGradeSubmission} />;
      case 'announcements':
        return <AnnouncementsTab announcements={announcements} onCreateAnnouncement={handleCreateAnnouncement} onDeleteAnnouncement={handleDeleteAnnouncement} />;
      case 'exports':
        return <ExportsTab onExportData={handleExportData} />;
      default:
        return <OverviewTab users={users} tasks={tasks} attendance={attendance} submissions={submissions} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}!</p>
        </div>

        {/* Superadmin Register Admin Section */}
        {user?.role === 'superadmin' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <RegisterAdmin />
          </div>
        )}

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
          {renderTabContent()}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalContent.title}
      >
        {modalContent.content}
      </Modal>
    </div>
  );
};

export default AdminDashboard; 