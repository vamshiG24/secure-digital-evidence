// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    // Auth
    LOGIN: `${API_BASE_URL}/api/users/login`,
    REGISTER: `${API_BASE_URL}/api/users`,
    ME: `${API_BASE_URL}/api/users/me`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/users/profile`,

    // Cases
    CASES: `${API_BASE_URL}/api/cases`,
    CASE_BY_ID: (id) => `${API_BASE_URL}/api/cases/${id}`,

    // Evidence
    EVIDENCE: `${API_BASE_URL}/api/evidence`,
    EVIDENCE_LIST: (caseId) => `${API_BASE_URL}/api/evidence/${caseId}/list`,
    EVIDENCE_DOWNLOAD: (id) => `${API_BASE_URL}/api/evidence/${id}/download`,

    // Notifications
    NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
    MARK_NOTIFICATION_READ: (id) => `${API_BASE_URL}/api/notifications/${id}/read`,
    MARK_CASE_NOTIFICATIONS_READ: (caseId) => `${API_BASE_URL}/api/notifications/read-by-case/${caseId}`,

    // Audit Logs
    LOGS: `${API_BASE_URL}/api/logs`,

    // AI Features
    AI_SEARCH: `${API_BASE_URL}/api/ai/search`,
    AI_SIMILAR_CASES: (caseId) => `${API_BASE_URL}/api/ai/similar/${caseId}`,

    // Users
    USERS: `${API_BASE_URL}/api/users`,
};

// Socket.IO URL
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default API_BASE_URL;
