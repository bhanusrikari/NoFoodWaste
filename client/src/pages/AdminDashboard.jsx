import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/authContext';
import { getAdminDashboardData, seedDashboardData } from '../services/dashboardService';
import {
  getAllFoodRequests,
  updateFoodRequestStatus,
  manualMatchDonor,
  getAvailableDonations,
  createFoodRequest,
} from '../services/foodRequestService';
import {
  getAllDonations,
  verifyDonation,
  assignBeneficiary,
  flagOrCancelDonation,
  getOpenRequestsForMatching,
} from '../services/donationService';
import {
  getSuggestedMatches,
  findMatchesForRequest,
  findMatchesForDonation,
  approveMatch,
  rejectMatch,
} from '../services/matchingService';
import {
  getAllBeneficiaries,
  getBeneficiaryById,
  createBeneficiary,
  updateBeneficiary,
  verifyBeneficiary,
  rejectBeneficiary,
  toggleStatus as toggleBenStatus,
} from '../services/beneficiaryService';
import {
  getAllVolunteers,
  getVolunteerById,
  updateVolunteerProfile,
  verifyVolunteer as verifyVolunteerApi,
  rejectVolunteer as rejectVolunteerApi,
  toggleStatus as toggleVolStatus,
  updateAvailability as updateVolAvailability,
  assignDelivery as assignVolDelivery,
} from '../services/volunteerService';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  toggleStatus as toggleVehStatus,
  updateVehicleStatus,
  assignDelivery as assignVehDelivery,
} from '../services/vehicleService';
import {
  getPendingDeliveryAssignments,
  getAvailableDeliveryResources,
  assignDeliveryResources,
  reassignDeliveryResources,
  cancelDeliveryAssignment,
  getAllDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
} from '../services/deliveryService';
import {
  getAllUsers,
  getUserById as getUserProfileApi,
  toggleUserAccountStatus,
  verifyUserAccount,
  updateUserRole,
} from '../services/userService';
import {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';
import {
  submitReport,
  getAllReports,
  getReportById,
  updateReportStatus,
} from '../services/reportService';
import {
  volunteerRejectDelivery,
  processPartialFulfillment,
  cancelEntity,
} from '../services/exceptionService';
import { getAnalyticsData } from '../services/analyticsService';
import { getAllActivityLogs } from '../services/activityLogService';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [donations, setDonations] = useState([]);
  const [suggestedMatches, setSuggestedMatches] = useState([]);
  const [openRequestsForAssign, setOpenRequestsForAssign] = useState([]);

  const [reqStats, setReqStats] = useState({ total: 0, submitted: 0, verified: 0, matched: 0, completed: 0, rejected: 0, cancelled: 0 });
  const [donStats, setDonStats] = useState({ total: 0, submitted: 0, verified: 0, matched: 0, completed: 0, flagged: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Food Request Filters
  const [reqStatusFilter, setReqStatusFilter] = useState('ALL');
  const [reqDateFilter, setReqDateFilter] = useState('');
  const [reqLocationFilter, setReqLocationFilter] = useState('');
  const [reqFoodTypeFilter, setReqFoodTypeFilter] = useState('ALL');
  const [reqCategoryFilter, setReqCategoryFilter] = useState('ALL');
  const [reqSearch, setReqSearch] = useState('');

  // Donation Filters
  const [donStatusFilter, setDonStatusFilter] = useState('ALL');
  const [donOriginFilter, setDonOriginFilter] = useState('ALL');
  const [donFoodTypeFilter, setDonFoodTypeFilter] = useState('ALL');
  const [donCategoryFilter, setDonCategoryFilter] = useState('ALL');
  const [donSearch, setDonSearch] = useState('');

  // Beneficiary Module States
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [benSearch, setBenSearch] = useState('');
  const [benCategoryFilter, setBenCategoryFilter] = useState('ALL');
  const [benVerificationFilter, setBenVerificationFilter] = useState('ALL');
  const [benAccountFilter, setBenAccountFilter] = useState('ALL');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [showBenDetailModal, setShowBenDetailModal] = useState(false);
  const [showAddBenModal, setShowAddBenModal] = useState(false);
  const [showEditBenModal, setShowEditBenModal] = useState(false);
  const [editingBenId, setEditingBenId] = useState(null);
  const [benFormData, setBenFormData] = useState({
    organizationName: '',
    category: 'Shelter',
    contactPerson: '',
    phone: '',
    email: '',
    location: '',
    city: 'Hyderabad',
    peopleServed: 50,
    notes: '',
  });

  // Volunteer Module States
  const [volunteers, setVolunteers] = useState([]);
  const [volSearch, setVolSearch] = useState('');
  const [volVerificationFilter, setVolVerificationFilter] = useState('ALL');
  const [volAvailabilityFilter, setVolAvailabilityFilter] = useState('ALL');
  const [volAccountFilter, setVolAccountFilter] = useState('ALL');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [showVolDetailModal, setShowVolDetailModal] = useState(false);
  const [showAssignVolModal, setShowAssignVolModal] = useState(false);
  const [selectedVolForAssignment, setSelectedVolForAssignment] = useState(null);

  // Vehicle Module States
  const [vehicles, setVehicles] = useState([]);
  const [vehSearch, setVehSearch] = useState('');
  const [vehStatusFilter, setVehStatusFilter] = useState('ALL');
  const [vehTypeFilter, setVehTypeFilter] = useState('ALL');
  const [vehAccountFilter, setVehAccountFilter] = useState('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showVehDetailModal, setShowVehDetailModal] = useState(false);
  const [showAddVehModal, setShowAddVehModal] = useState(false);
  const [showEditVehModal, setShowEditVehModal] = useState(false);
  const [showAssignVehModal, setShowAssignVehModal] = useState(false);
  const [editingVehId, setEditingVehId] = useState(null);
  const [selectedVehForAssignment, setSelectedVehForAssignment] = useState(null);
  const [vehFormData, setVehFormData] = useState({
    vehicleNumber: '',
    vehicleType: 'Two Wheeler',
    capacity: 100,
    city: 'Hyderabad',
    notes: '',
  });

  // Delivery Assignment & Deliveries Module States
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [pendingAssignSearch, setPendingAssignSearch] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [delFilterType, setDelFilterType] = useState('ALL');
  const [delSearch, setDelSearch] = useState('');
  const [delStats, setDelStats] = useState({ total: 0, pendingAssignment: 0, active: 0, completed: 0, cancelled: 0, delayed: 0 });

  const [showAssignResourcesModal, setShowAssignResourcesModal] = useState(false);
  const [selectedPendingDelivery, setSelectedPendingDelivery] = useState(null);
  const [availableVolunteersList, setAvailableVolunteersList] = useState([]);
  const [availableVehiclesList, setAvailableVehiclesList] = useState([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const [showDeliveryDetailModal, setShowDeliveryDetailModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showStatusProgressionModal, setShowStatusProgressionModal] = useState(false);
  const [nextStatusSelection, setNextStatusSelection] = useState('');
  const [statusNoteSelection, setStatusNoteSelection] = useState('');

  // 1. Notifications State
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifFilterRead, setNotifFilterRead] = useState('ALL');

  // 2. Users Module State
  const [usersList, setUsersList] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [userStats, setUserStats] = useState({ total: 0, customers: 0, donors: 0, volunteers: 0, admins: 0, active: 0, inactive: 0 });
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [selectedUserRole, setSelectedUserRole] = useState('CUSTOMER');

  // 3. Reports & Issues Module State
  const [reportsList, setReportsList] = useState([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');
  const [reportPriorityFilter, setReportPriorityFilter] = useState('ALL');
  const [reportIssueTypeFilter, setReportIssueTypeFilter] = useState('ALL');
  const [reportSearch, setReportSearch] = useState('');
  const [reportStats, setReportStats] = useState({ total: 0, open: 0, investigating: 0, resolved: 0, closed: 0, urgent: 0 });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportDetailModal, setShowReportDetailModal] = useState(false);
  const [reportStatusInput, setReportStatusInput] = useState('INVESTIGATING');
  const [reportPriorityInput, setReportPriorityInput] = useState('MEDIUM');
  const [resolutionNotesInput, setResolutionNotesInput] = useState('');

  // 4. Partial Fulfillment / Exception State
  const [showPartialFulfillModal, setShowPartialFulfillModal] = useState(false);
  const [partialTargetDonation, setPartialTargetDonation] = useState(null);
  const [partialTargetRequest, setPartialTargetRequest] = useState(null);
  const [partialFulFillInputQty, setPartialFulFillInputQty] = useState(50);
  const [partialNotes, setPartialNotes] = useState('');

  // 5. Analytics Module State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 6. Activity Audit Logs State
  const [activityLogsList, setActivityLogsList] = useState([]);
  const [logRoleFilter, setLogRoleFilter] = useState('ALL');
  const [logActionFilter, setLogActionFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');

  // Modal States
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showReqDetailModal, setShowReqDetailModal] = useState(false);
  const [showDonDetailModal, setShowDonDetailModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showAssignBeneficiaryModal, setShowAssignBeneficiaryModal] = useState(false);
  const [matchingRequest, setMatchingRequest] = useState(null);
  const [assigningDonation, setAssigningDonation] = useState(null);
  const [availableDonationsList, setAvailableDonationsList] = useState([]);
  const [actionModal, setActionModal] = useState({ show: false, module: '', type: '', item: null });
  const [reasonInput, setReasonInput] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // New Requirement Form
  const [showNewModal, setShowNewModal] = useState(false);
  const [newRequestData, setNewRequestData] = useState({
    customerName: '',
    organizationName: '',
    phone: '',
    email: '',
    numberOfMeals: 50,
    foodType: 'Veg',
    foodCategory: 'Cooked',
    location: '',
    city: 'Hyderabad',
    requiredDate: new Date().toISOString().split('T')[0],
    requiredTime: '13:00',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch Dashboard Metrics
      const dashRes = await getAdminDashboardData();
      if (dashRes.success) setDashboardData(dashRes.data);

      // Fetch Suggested Matches (Matching Service Scoring Engine)
      const matchRes = await getSuggestedMatches();
      if (matchRes.success) setSuggestedMatches(matchRes.data || []);

      // Fetch Beneficiaries
      const benParams = {};
      if (benCategoryFilter !== 'ALL') benParams.category = benCategoryFilter;
      if (benVerificationFilter !== 'ALL') benParams.verificationStatus = benVerificationFilter;
      if (benAccountFilter !== 'ALL') benParams.accountStatus = benAccountFilter;
      if (benSearch.trim()) benParams.search = benSearch;

      const benRes = await getAllBeneficiaries(benParams);
      setBeneficiaries(benRes.data || []);

      // Fetch Volunteers
      const volParams = {};
      if (volVerificationFilter !== 'ALL') volParams.verificationStatus = volVerificationFilter;
      if (volAvailabilityFilter !== 'ALL') volParams.availabilityStatus = volAvailabilityFilter;
      if (volAccountFilter !== 'ALL') volParams.accountStatus = volAccountFilter;
      if (volSearch.trim()) volParams.search = volSearch;

      const volRes = await getAllVolunteers(volParams);
      setVolunteers(volRes.data || []);

      // Fetch Vehicles
      const vehParams = {};
      if (vehStatusFilter !== 'ALL') vehParams.status = vehStatusFilter;
      if (vehTypeFilter !== 'ALL') vehParams.vehicleType = vehTypeFilter;
      if (vehAccountFilter !== 'ALL') vehParams.accountStatus = vehAccountFilter;
      if (vehSearch.trim()) vehParams.search = vehSearch;

      const vehRes = await getAllVehicles(vehParams);
      setVehicles(vehRes.data || []);

      // Fetch Food Requests
      const reqParams = {};
      if (reqStatusFilter !== 'ALL') reqParams.status = reqStatusFilter;
      if (reqDateFilter) reqParams.date = reqDateFilter;
      if (reqLocationFilter.trim()) reqParams.location = reqLocationFilter;
      if (reqFoodTypeFilter !== 'ALL') reqParams.foodType = reqFoodTypeFilter;
      if (reqCategoryFilter !== 'ALL') reqParams.foodCategory = reqCategoryFilter;
      if (reqSearch.trim()) reqParams.search = reqSearch;

      const reqRes = await getAllFoodRequests(reqParams);
      setRequests(reqRes.data || []);
      if (reqRes.stats) setReqStats(reqRes.stats);

      // Fetch Donations
      const donParams = {};
      if (donStatusFilter !== 'ALL') donParams.status = donStatusFilter;
      if (donOriginFilter !== 'ALL') donParams.origin = donOriginFilter;
      if (donFoodTypeFilter !== 'ALL') donParams.foodType = donFoodTypeFilter;
      if (donCategoryFilter !== 'ALL') donParams.foodCategory = donCategoryFilter;
      if (donSearch.trim()) donParams.search = donSearch;

      const donRes = await getAllDonations(donParams);
      setDonations(donRes.data || []);
      if (donRes.stats) setDonStats(donRes.stats);

      // Fetch Pending Delivery Assignments
      const pendingRes = await getPendingDeliveryAssignments({ search: pendingAssignSearch });
      setPendingAssignments(pendingRes.data || []);

      // Fetch All Deliveries
      const delParams = { filterType: delFilterType };
      if (delSearch.trim()) delParams.search = delSearch;
      const delRes = await getAllDeliveries(delParams);
      setDeliveries(delRes.data || []);
      if (delRes.stats) setDelStats(delRes.stats);

      // Fetch Notifications
      const notifRes = await getAdminNotifications();
      setNotificationsList(notifRes.data || []);
      setUnreadNotifCount(notifRes.unreadCount || 0);

      // Fetch Users
      const userParams = {};
      if (userRoleFilter !== 'ALL') userParams.role = userRoleFilter;
      if (userStatusFilter !== 'ALL') userParams.accountStatus = userStatusFilter;
      if (userSearch.trim()) userParams.search = userSearch;
      const userRes = await getAllUsers(userParams);
      setUsersList(userRes.data || []);
      if (userRes.stats) setUserStats(userRes.stats);

      // Fetch Reports
      const repParams = {};
      if (reportStatusFilter !== 'ALL') repParams.status = reportStatusFilter;
      if (reportPriorityFilter !== 'ALL') repParams.priority = reportPriorityFilter;
      if (reportIssueTypeFilter !== 'ALL') repParams.issueType = reportIssueTypeFilter;
      if (reportSearch.trim()) repParams.search = reportSearch;
      const repRes = await getAllReports(repParams);
      setReportsList(repRes.data || []);
      if (repRes.stats) setReportStats(repRes.stats);

      // Fetch Analytics Data
      const analyticsParams = { timeframe: analyticsTimeframe };
      if (analyticsTimeframe === 'custom' && customStartDate && customEndDate) {
        analyticsParams.startDate = customStartDate;
        analyticsParams.endDate = customEndDate;
      }
      const analyticsRes = await getAnalyticsData(analyticsParams);
      setAnalyticsData(analyticsRes.data || null);

      // Fetch Activity Logs
      const logParams = {};
      if (logRoleFilter !== 'ALL') logParams.role = logRoleFilter;
      if (logActionFilter !== 'ALL') logParams.actionType = logActionFilter;
      if (logSearch.trim()) logParams.search = logSearch;
      const logRes = await getAllActivityLogs(logParams);
      setActivityLogsList(logRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load control center data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    reqStatusFilter, reqDateFilter, reqLocationFilter, reqFoodTypeFilter, reqCategoryFilter, reqSearch,
    donStatusFilter, donOriginFilter, donFoodTypeFilter, donCategoryFilter, donSearch,
    benCategoryFilter, benVerificationFilter, benAccountFilter, benSearch,
    volVerificationFilter, volAvailabilityFilter, volAccountFilter, volSearch,
    vehStatusFilter, vehTypeFilter, vehAccountFilter, vehSearch,
    pendingAssignSearch, delFilterType, delSearch,
    userRoleFilter, userStatusFilter, userSearch,
    reportStatusFilter, reportPriorityFilter, reportIssueTypeFilter, reportSearch,
    analyticsTimeframe, customStartDate, customEndDate,
    logRoleFilter, logActionFilter, logSearch,
  ]);

  const handleSeedData = async () => {
    try {
      setLoading(true);
      const res = await seedDashboardData();
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to seed demo operations');
    } finally {
      setLoading(false);
    }
  };

  // Beneficiary Action Handlers
  const handleVerifyBeneficiary = async (benId) => {
    try {
      setLoading(true);
      const res = await verifyBeneficiary(benId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to verify beneficiary');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRejectBenModal = (ben) => {
    setActionModal({ show: true, module: 'BENEFICIARY_REJECT', type: 'REJECT', item: ben });
    setReasonInput('');
  };

  const handleConfirmRejectBeneficiary = async () => {
    const { item } = actionModal;
    if (!item) return;

    try {
      setLoading(true);
      const res = await rejectBeneficiary(item.id, reasonInput || 'Verification requirements not met');
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setActionModal({ show: false, module: '', type: '', item: null });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to reject beneficiary');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBeneficiaryStatus = async (benId) => {
    try {
      setLoading(true);
      const res = await toggleBenStatus(benId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update account status');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBeneficiaryDetail = async (benId) => {
    try {
      setLoading(true);
      const res = await getBeneficiaryById(benId);
      setSelectedBeneficiary(res.data);
      setShowBenDetailModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch beneficiary details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddBenModal = () => {
    setEditingBenId(null);
    setBenFormData({
      organizationName: '',
      category: 'Shelter',
      contactPerson: '',
      phone: '',
      email: '',
      location: '',
      city: 'Hyderabad',
      peopleServed: 50,
      notes: '',
    });
    setShowAddBenModal(true);
  };

  const handleOpenEditBenModal = (ben) => {
    setEditingBenId(ben.id);
    setBenFormData({
      organizationName: ben.organizationName || '',
      category: ben.category || 'Shelter',
      contactPerson: ben.contactPerson || '',
      phone: ben.phone || '',
      email: ben.email || '',
      location: ben.location || '',
      city: ben.city || 'Hyderabad',
      peopleServed: ben.peopleServed || 50,
      notes: ben.notes || '',
    });
    setShowEditBenModal(true);
  };

  const handleSubmitBenForm = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingBenId) {
        const res = await updateBeneficiary(editingBenId, benFormData);
        setSuccessMsg(res.message);
        setShowEditBenModal(false);
      } else {
        const res = await createBeneficiary(benFormData);
        setSuccessMsg(res.message);
        setShowAddBenModal(false);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save beneficiary');
    } finally {
      setLoading(false);
    }
  };

  // Volunteer Action Handlers
  const handleVerifyVolunteer = async (volId) => {
    try {
      setLoading(true);
      const res = await verifyVolunteerApi(volId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to verify volunteer');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRejectVolModal = (vol) => {
    setActionModal({ show: true, module: 'VOLUNTEER_REJECT', type: 'REJECT', item: vol });
    setReasonInput('');
  };

  const handleConfirmRejectVolunteer = async () => {
    const { item } = actionModal;
    if (!item) return;

    try {
      setLoading(true);
      const res = await rejectVolunteerApi(item.id, reasonInput || 'Background verification check failed');
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setActionModal({ show: false, module: '', type: '', item: null });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to reject volunteer');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVolunteerStatus = async (volId) => {
    try {
      setLoading(true);
      const res = await toggleVolStatus(volId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update account status');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVolunteerAvailability = async (vol) => {
    try {
      setLoading(true);
      const nextState = vol.availabilityStatus === 'OFFLINE' ? 'AVAILABLE' : 'OFFLINE';
      const res = await updateVolAvailability(vol.id, nextState);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update availability status');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVolunteerDetail = async (volId) => {
    try {
      setLoading(true);
      const res = await getVolunteerById(volId);
      setSelectedVolunteer(res.data);
      setShowVolDetailModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch volunteer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignVolModal = (vol) => {
    setSelectedVolForAssignment(vol);
    setShowAssignVolModal(true);
  };

  // Vehicle Action Handlers
  const handleToggleVehicleStatus = async (vehId) => {
    try {
      setLoading(true);
      const res = await toggleVehStatus(vehId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update vehicle account status');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVehicleOperationalStatus = async (vehId, status) => {
    try {
      setLoading(true);
      const res = await updateVehicleStatus(vehId, status);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update operational status');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVehicleDetail = async (vehId) => {
    try {
      setLoading(true);
      const res = await getVehicleById(vehId);
      setSelectedVehicle(res.data);
      setShowVehDetailModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddVehModal = () => {
    setEditingVehId(null);
    setVehFormData({
      vehicleNumber: '',
      vehicleType: 'Two Wheeler',
      capacity: 100,
      city: 'Hyderabad',
      notes: '',
    });
    setShowAddVehModal(true);
  };

  const handleOpenEditVehModal = (veh) => {
    setEditingVehId(veh.id);
    setVehFormData({
      vehicleNumber: veh.vehicleNumber || '',
      vehicleType: veh.vehicleType || 'Two Wheeler',
      capacity: veh.capacity || 100,
      city: veh.city || 'Hyderabad',
      notes: veh.notes || '',
    });
    setShowEditVehModal(true);
  };

  const handleSubmitVehForm = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingVehId) {
        const res = await updateVehicle(editingVehId, vehFormData);
        setSuccessMsg(res.message);
        setShowEditVehModal(false);
      } else {
        const res = await createVehicle(vehFormData);
        setSuccessMsg(res.message);
        setShowAddVehModal(false);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignVehModal = (veh) => {
    setSelectedVehForAssignment(veh);
    setShowAssignVehModal(true);
  };

  const handleConfirmAssignVehToDelivery = async (deliveryId) => {
    if (!selectedVehForAssignment) return;
    try {
      setLoading(true);
      const res = await assignVehDelivery(selectedVehForAssignment.id, deliveryId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowAssignVehModal(false);
      setSelectedVehForAssignment(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to assign vehicle to delivery');
    } finally {
      setLoading(false);
    }
  };
  const handleApproveSuggestedMatch = async (reqId, donId) => {
    try {
      setLoading(true);
      const res = await approveMatch(reqId, donId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to approve match');
    } finally {
      setLoading(false);
    }
  };

  // Matching Engine Reject Action
  const handleRejectSuggestedMatch = async (reqId, donId) => {
    try {
      setLoading(true);
      const res = await rejectMatch(reqId, donId, 'Admin rejected suggested pairing');
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to reject match');
    } finally {
      setLoading(false);
    }
  };

  // Donor Verification
  const handleVerifyDonation = async (donId) => {
    try {
      setLoading(true);
      const res = await verifyDonation(donId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to verify donation');
    } finally {
      setLoading(false);
    }
  };

  // Assign Beneficiary Modal
  const handleOpenAssignModal = async (don) => {
    try {
      setAssigningDonation(don);
      const res = await getOpenRequestsForMatching();
      setOpenRequestsForAssign(res.data || []);
      setShowAssignBeneficiaryModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch open food requirements');
    }
  };

  const handleConfirmAssignBeneficiary = async (requestId) => {
    if (!assigningDonation) return;
    try {
      setLoading(true);
      const res = await assignBeneficiary(assigningDonation.id, requestId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowAssignBeneficiaryModal(false);
      setAssigningDonation(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to assign beneficiary');
    } finally {
      setLoading(false);
    }
  };

  // Flag or Cancel Donation Action
  const handleOpenDonationActionModal = (type, don) => {
    setActionModal({ show: true, module: 'DONATION', type, item: don });
    setReasonInput('');
  };

  const handleConfirmDonationAction = async () => {
    const { type, item } = actionModal;
    if (!item) return;

    try {
      setLoading(true);
      const res = await flagOrCancelDonation(item.id, type, reasonInput || 'Admin action');
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setActionModal({ show: false, module: '', type: '', item: null });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update donation');
    } finally {
      setLoading(false);
    }
  };

  // Requirement Actions
  const handleOpenReqActionModal = (type, req) => {
    setActionModal({ show: true, module: 'REQUEST', type, item: req });
    setReasonInput('');
    setAdminNoteInput(req.adminNotes || '');
  };

  const handleConfirmReqAction = async () => {
    const { type, item } = actionModal;
    if (!item) return;

    let targetStatus = type;
    if (type === 'APPROVE') targetStatus = 'VERIFIED';

    const payload = {
      status: targetStatus,
      adminNotes: adminNoteInput,
    };

    if (targetStatus === 'REJECTED') payload.rejectionReason = reasonInput || 'Rejected by admin';
    if (targetStatus === 'CANCELLED') payload.cancellationReason = reasonInput || 'Cancelled by admin';

    try {
      setLoading(true);
      const res = await updateFoodRequestStatus(item.id, payload);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setActionModal({ show: false, module: '', type: '', item: null });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMatchModal = async (req) => {
    try {
      setMatchingRequest(req);
      const res = await getAvailableDonations();
      setAvailableDonationsList(res.data || []);
      setShowMatchModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch available donations');
    }
  };

  const handleConfirmMatch = async (donationId) => {
    if (!matchingRequest) return;
    try {
      setLoading(true);
      const res = await manualMatchDonor(matchingRequest.id, donationId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowMatchModal(false);
      setMatchingRequest(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to match donor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewRequest = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await createFoodRequest(newRequestData);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowNewModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create requirement');
    } finally {
      setLoading(false);
    }
  };

  const summary = dashboardData?.summaryCards || {
    openFoodRequests: 0,
    availableDonations: 0,
    pendingMatches: 0,
    pendingDeliveryAssignments: 0,
    activeDeliveries: 0,
    completedDeliveriesToday: 0,
    availableVolunteers: 0,
    verifiedBeneficiaries: 0,
  };

  const activeOperations = dashboardData?.activeOperations || [];
  const impact = dashboardData?.todaysImpact || {
    mealsDonated: 0,
    mealsDelivered: 0,
    requestsFulfilled: 0,
    activeDonors: 0,
    activeBeneficiaries: 0,
  };

  const getStatusBadge = (status) => {
    const s = (status || 'SUBMITTED').toUpperCase();
    switch (s) {
      case 'SUBMITTED':
      case 'PENDING':
        return <span className="badge badge-submitted">⏳ Submitted</span>;
      case 'VERIFIED':
        return <span className="badge badge-verified">✅ Verified</span>;
      case 'AVAILABLE':
      case 'OPEN':
        return <span className="badge badge-open">🟢 Available</span>;
      case 'DONOR_MATCHED':
      case 'MATCHED':
        return <span className="badge badge-donor_matched">🤝 Matched</span>;
      case 'DELIVERY_ARRANGED':
      case 'ASSIGNED':
      case 'IN_TRANSIT':
        return <span className="badge badge-delivery_arranged">🛵 In Transit</span>;
      case 'DELIVERED':
      case 'ACKNOWLEDGED':
      case 'COMPLETED':
        return <span className="badge badge-completed">🎉 Completed</span>;
      case 'FLAGGED':
        return <span className="badge badge-rejected">🚩 Flagged</span>;
      case 'REJECTED':
        return <span className="badge badge-rejected">❌ Rejected</span>;
      case 'CANCELLED':
        return <span className="badge badge-cancelled">🚫 Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getVerificationBadge = (vStatus) => {
    switch (vStatus) {
      case 'VERIFIED':
        return <span className="badge badge-verified">✅ Verified</span>;
      case 'PENDING_VERIFICATION':
        return <span className="badge badge-submitted">⏳ Pending Verification</span>;
      case 'REJECTED':
        return <span className="badge badge-rejected">❌ Rejected</span>;
      default:
        return <span className="badge">{vStatus}</span>;
    }
  };

  const getAccountBadge = (aStatus) => {
    return aStatus === 'ACTIVE' ? (
      <span className="badge badge-open">🟢 Active</span>
    ) : (
      <span className="badge badge-cancelled">🔴 Inactive</span>
    );
  };

  const getAvailabilityBadge = (aState) => {
    switch (aState) {
      case 'AVAILABLE':
        return <span className="badge badge-open">🟢 Available</span>;
      case 'ASSIGNED':
        return <span className="badge badge-donor_matched">🤝 Assigned</span>;
      case 'ON_DELIVERY':
        return <span className="badge badge-delivery_arranged">🛵 On Delivery</span>;
      case 'OFFLINE':
      default:
        return <span className="badge badge-cancelled">🔴 Offline</span>;
    }
  };

  const getVehicleStatusBadge = (vStatus) => {
    switch (vStatus) {
      case 'AVAILABLE':
        return <span className="badge badge-open">🟢 Available</span>;
      case 'ASSIGNED':
        return <span className="badge badge-donor_matched">🤝 Assigned</span>;
      case 'IN_USE':
        return <span className="badge badge-delivery_arranged">🚚 In Use</span>;
      case 'UNAVAILABLE':
      default:
        return <span className="badge badge-cancelled">🔴 Unavailable</span>;
    }
  };

  const getDeliveryStatusBadge = (status, isDelayed = false) => {
    if (isDelayed) {
      return <span className="badge badge-rejected">⚠️ Delayed ({status})</span>;
    }
    switch (status) {
      case 'PENDING_ASSIGNMENT':
        return <span className="badge badge-submitted">⏳ Pending Assignment</span>;
      case 'ASSIGNED':
        return <span className="badge badge-donor_matched">📌 Volunteer & Vehicle Assigned</span>;
      case 'ACCEPTED':
        return <span className="badge badge-donor_matched">👍 Assignment Accepted</span>;
      case 'GOING_TO_PICKUP':
        return <span className="badge badge-delivery_arranged">🛵 Going to Pickup</span>;
      case 'FOOD_COLLECTED':
        return <span className="badge badge-delivery_arranged">📦 Food Collected</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="badge badge-delivery_arranged">🚚 Out for Delivery</span>;
      case 'DELIVERED':
        return <span className="badge badge-verified">📍 Delivered</span>;
      case 'ACKNOWLEDGED':
        return <span className="badge badge-verified">✍️ Recipient Acknowledged</span>;
      case 'COMPLETED':
        return <span className="badge badge-completed">🎉 Completed</span>;
      case 'CANCELLED':
        return <span className="badge badge-cancelled">🚫 Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  // Delivery Assignment & Deliveries Action Handlers
  const handleOpenAssignResourcesModal = async (delivery) => {
    try {
      setLoading(true);
      setSelectedPendingDelivery(delivery);
      const res = await getAvailableDeliveryResources(delivery.numberOfMeals);
      const vols = res.data.volunteers || [];
      const vehs = res.data.vehicles || [];
      setAvailableVolunteersList(vols);
      setAvailableVehiclesList(vehs);
      setSelectedVolunteerId(vols.length > 0 ? vols[0].id : '');
      setSelectedVehicleId(vehs.length > 0 ? vehs[0].id : '');
      setShowAssignResourcesModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch available volunteers and vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAssignResources = async () => {
    if (!selectedPendingDelivery || !selectedVolunteerId || !selectedVehicleId) {
      setError('Please select both a volunteer and a vehicle for assignment');
      return;
    }
    try {
      setLoading(true);
      const res = await assignDeliveryResources(selectedPendingDelivery.id, {
        volunteerId: selectedVolunteerId,
        vehicleId: selectedVehicleId,
      });
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowAssignResourcesModal(false);
      setSelectedPendingDelivery(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to assign volunteer and vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeliveryAssignmentHandler = async (deliveryId) => {
    try {
      setLoading(true);
      const res = await cancelDeliveryAssignment(deliveryId, 'Assignment cancelled by administrator');
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel delivery assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeliveryDetail = async (deliveryId) => {
    try {
      setLoading(true);
      const res = await getDeliveryById(deliveryId);
      setSelectedDelivery(res.data);
      setShowDeliveryDetailModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch delivery details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusProgressionModal = (delivery) => {
    setSelectedDelivery(delivery);
    const lifecycleOrder = [
      'ASSIGNED',
      'ACCEPTED',
      'GOING_TO_PICKUP',
      'FOOD_COLLECTED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'ACKNOWLEDGED',
      'COMPLETED',
    ];
    const currentIndex = lifecycleOrder.indexOf(delivery.status);
    const nextStatus =
      currentIndex >= 0 && currentIndex < lifecycleOrder.length - 1
        ? lifecycleOrder[currentIndex + 1]
        : 'COMPLETED';
    setNextStatusSelection(nextStatus);
    setStatusNoteSelection(`Advanced status from ${delivery.status} to ${nextStatus}`);
    setShowStatusProgressionModal(true);
  };

  const handleConfirmUpdateStatus = async () => {
    if (!selectedDelivery || !nextStatusSelection) return;
    try {
      setLoading(true);
      const res = await updateDeliveryStatus(selectedDelivery.id, {
        status: nextStatusSelection,
        note: statusNoteSelection,
      });
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowStatusProgressionModal(false);
      setSelectedDelivery(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update delivery status');
    } finally {
      setLoading(false);
    }
  };

  // 1. Notification Handlers
  const handleMarkNotifRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to mark all as read');
    }
  };

  // 2. User Module Handlers
  const handleToggleUserStatus = async (userId) => {
    try {
      setLoading(true);
      const res = await toggleUserAccountStatus(userId);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update user account status');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUserProfile = async (userId) => {
    try {
      setLoading(true);
      const res = await getUserProfileApi(userId);
      setSelectedUserProfile(res.data);
      setShowUserDetailModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch user profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditRoleModal = (user) => {
    setSelectedUserProfile(user);
    setSelectedUserRole(user.role || 'CUSTOMER');
    setShowEditRoleModal(true);
  };

  const handleConfirmUpdateRole = async () => {
    if (!selectedUserProfile) return;
    try {
      setLoading(true);
      const res = await updateUserRole(selectedUserProfile.id || selectedUserProfile._id, selectedUserRole);
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowEditRoleModal(false);
      setSelectedUserProfile(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  // 3. Report Handlers
  const handleOpenReportDetail = (rep) => {
    setSelectedReport(rep);
    setReportStatusInput(rep.status || 'INVESTIGATING');
    setReportPriorityInput(rep.priority || 'MEDIUM');
    setResolutionNotesInput(rep.resolutionNotes || '');
    setShowReportDetailModal(true);
  };

  const handleConfirmUpdateReportStatus = async () => {
    if (!selectedReport) return;
    try {
      setLoading(true);
      const res = await updateReportStatus(selectedReport.id, {
        status: reportStatusInput,
        priority: reportPriorityInput,
        resolutionNotes: resolutionNotesInput,
      });
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowReportDetailModal(false);
      setSelectedReport(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update issue report');
    } finally {
      setLoading(false);
    }
  };

  // 4. Exception & Partial Fulfillment Handlers
  const handleOpenPartialFulfillModal = (donation, request) => {
    setPartialTargetDonation(donation);
    setPartialTargetRequest(request);
    const reqQty = request ? request.numberOfMeals : 100;
    const donQty = donation ? donation.numberOfMeals : 60;
    setPartialFulFillInputQty(Math.min(reqQty, donQty));
    setPartialNotes(`Partial fulfillment of ${Math.min(reqQty, donQty)} meals`);
    setShowPartialFulfillModal(true);
  };

  const handleConfirmPartialFulfillment = async () => {
    if (!partialTargetDonation || !partialTargetRequest) return;
    try {
      setLoading(true);
      const res = await processPartialFulfillment({
        donationId: partialTargetDonation.id,
        requestId: partialTargetRequest.id,
        fulfilledQuantity: partialFulFillInputQty,
        notes: partialNotes,
      });
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowPartialFulfillModal(false);
      setPartialTargetDonation(null);
      setPartialTargetRequest(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to process partial fulfillment');
    } finally {
      setLoading(false);
    }
  };

  const handleVolunteerRejectTaskHandler = async (deliveryId) => {
    try {
      setLoading(true);
      const res = await volunteerRejectDelivery(deliveryId, 'Task rejected by volunteer (re-assignment requested)');
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to reject task');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="container">
      {/* HEADER CONTROL CENTER */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>
            🛡️ Admin Operations Control Center
            <span className="live-indicator">
              <span className="live-dot"></span> Live Operations
            </span>
          </h1>
          <p>Real-time control center, matching engine, active delivery pipeline & impact analytics</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-outline btn-sm"
            style={{ position: 'relative', fontWeight: 600 }}
            onClick={() => setShowNotifModal(true)}
          >
            🔔 Notifications
            {unreadNotifCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {unreadNotifCount}
              </span>
            )}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            🔄 Refresh Data
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSeedData}>
            🌱 Seed Demo Operations
          </button>
        </div>
      </div>

      {/* ALERTS */}
      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* SECTION 1: 8 REAL-TIME SUMMARY CARDS */}
      <div className="summary-grid-8">
        <div className="summary-card card-amber">
          <div className="summary-info">
            <div className="summary-num">{summary.openFoodRequests}</div>
            <div className="summary-title">Open Food Requests</div>
          </div>
          <div className="summary-icon-box">📋</div>
        </div>

        <div className="summary-card card-emerald">
          <div className="summary-info">
            <div className="summary-num">{summary.availableDonations}</div>
            <div className="summary-title">Available Donations</div>
          </div>
          <div className="summary-icon-box">🍱</div>
        </div>

        <div className="summary-card card-indigo">
          <div className="summary-info">
            <div className="summary-num">{summary.pendingMatches}</div>
            <div className="summary-title">Pending Matches</div>
          </div>
          <div className="summary-icon-box">🤝</div>
        </div>

        <div className="summary-card card-blue">
          <div className="summary-info">
            <div className="summary-num">{summary.pendingDeliveryAssignments}</div>
            <div className="summary-title">Pending Delivery Assignments</div>
          </div>
          <div className="summary-icon-box">🚚</div>
        </div>

        <div className="summary-card card-purple">
          <div className="summary-info">
            <div className="summary-num">{summary.activeDeliveries}</div>
            <div className="summary-title">Active Deliveries</div>
          </div>
          <div className="summary-icon-box">🛵</div>
        </div>

        <div className="summary-card card-green">
          <div className="summary-info">
            <div className="summary-num">{summary.completedDeliveriesToday}</div>
            <div className="summary-title">Completed Deliveries Today</div>
          </div>
          <div className="summary-icon-box">🎉</div>
        </div>

        <div className="summary-card card-teal">
          <div className="summary-info">
            <div className="summary-num">{summary.availableVolunteers}</div>
            <div className="summary-title">Available Volunteers</div>
          </div>
          <div className="summary-icon-box">🙋‍♂️</div>
        </div>

        <div className="summary-card card-rose">
          <div className="summary-info">
            <div className="summary-num">{summary.verifiedBeneficiaries}</div>
            <div className="summary-title">Verified Beneficiaries</div>
          </div>
          <div className="summary-icon-box">🏛️</div>
        </div>
      </div>

      {/* SECTION 2: SUPPLY & DEMAND MATCHING ENGINE MODULE */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>⚡ Supply & Demand Matching Engine</h2>
            <p>Algorithmic match suitability scores (e.g. 94%), compatibility reasons, and dual entry points</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            ⚡ Re-Run Matching Engine
          </button>
        </div>

        {suggestedMatches.length === 0 ? (
          <div className="empty-state">
            <p>No suggested match pairings currently pending. All open supply & demand items are matched or fulfilled.</p>
          </div>
        ) : (
          <div className="matching-grid">
            {suggestedMatches.map((pair) => (
              <div key={pair.id} className="match-card">
                <div>
                  <div className="match-card-header">
                    <div>
                      <span className="match-score-pill">🔥 {pair.matchScore}% Match</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>
                        Distance: ~{pair.distanceKm} km
                      </span>
                    </div>
                    <span className="badge badge-verified">Suitability Verified</span>
                  </div>

                  {/* Compatibility Reasons */}
                  <div className="match-reasons-list">
                    {pair.reasons && pair.reasons.map((r, i) => (
                      <span key={i} className="match-reason-tag">
                        ✓ {r}
                      </span>
                    ))}
                  </div>

                  {/* Supply & Demand Entity Details */}
                  <div className="match-entities-grid">
                    <div className="match-entity-box">
                      <span className="match-entity-label">📋 Food Demand (Customer)</span>
                      <span className="match-entity-title">{pair.request.customerName}</span>
                      <span className="match-entity-sub">
                        ID: {pair.request.requestId} | {pair.request.numberOfMeals} meals ({pair.request.foodType})
                      </span>
                      <span className="match-entity-sub">📍 {pair.request.location}</span>
                    </div>

                    <div className="match-entity-box">
                      <span className="match-entity-label">🍱 Food Supply (Donor)</span>
                      <span className="match-entity-title">{pair.donation.donorName}</span>
                      <span className="match-entity-sub">
                        ID: {pair.donation.donationId} | {pair.donation.numberOfMeals} meals ({pair.donation.foodCategory})
                      </span>
                      <span className="match-entity-sub">📍 {pair.donation.pickupLocation}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    className="btn btn-success btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleApproveSuggestedMatch(pair.request.id, pair.donation.id)}
                  >
                    ✅ Approve Match ({pair.matchScore}%)
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleRejectSuggestedMatch(pair.request.id, pair.donation.id)}
                  >
                    ❌ Reject Match
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: ACTIVE OPERATIONS PIPELINE FLOW */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>🔄 Active Operations Flow</h2>
            <p>Complete lifecycle pipeline: Customer → Food Request → Donor → Volunteer → Delivery → Acknowledgement</p>
          </div>
        </div>

        <div className="pipeline-flow-banner">
          <div className="pipeline-flow-header">Operational Workflow Pipeline</div>
          <div className="pipeline-steps">
            <div className="pipeline-step">👤 Customer</div>
            <span className="pipeline-step-arrow">➔</span>
            <div className="pipeline-step">📋 Food Request</div>
            <span className="pipeline-step-arrow">➔</span>
            <div className="pipeline-step">🍱 Donor</div>
            <span className="pipeline-step-arrow">➔</span>
            <div className="pipeline-step">🙋 Volunteer</div>
            <span className="pipeline-step-arrow">➔</span>
            <div className="pipeline-step">🛵 Delivery</div>
            <span className="pipeline-step-arrow">➔</span>
            <div className="pipeline-step">📜 Acknowledgement</div>
          </div>
        </div>

        <div className="operations-table-wrapper">
          {activeOperations.length === 0 ? (
            <div className="empty-state">
              <p>No active operations in pipeline. Click "Seed Demo Operations" to populate live flows.</p>
            </div>
          ) : (
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Flow ID</th>
                  <th>Customer (Recipient)</th>
                  <th>Request ID & Meals</th>
                  <th>Matched Donor</th>
                  <th>Assigned Volunteer</th>
                  <th>Pipeline Stage</th>
                  <th>Receipt / Feedback</th>
                </tr>
              </thead>
              <tbody>
                {activeOperations.map((op) => (
                  <tr key={op.id}>
                    <td>
                      <span className="request-id-badge">{op.deliveryId}</span>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-name">{op.customerName}</span>
                        <span className="org-name">📍 {op.deliveryLocation || 'Local Area'}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{op.requestId}</strong>
                        <div>
                          <span className="meals-pill">{op.numberOfMeals} meals</span>
                        </div>
                      </div>
                    </td>
                    <td>🍱 {op.donorName}</td>
                    <td>🙋 {op.volunteerName}</td>
                    <td>
                      <span className={`stage-badge stage-${op.currentStageIndex}`}>
                        Stage {op.currentStageIndex}: {op.status}
                      </span>
                    </td>
                    <td>
                      {op.acknowledgement?.isAcknowledged ? (
                        <div style={{ color: '#047857', fontWeight: 600 }}>
                          ⭐ {op.acknowledgement.rating}/5 Rating
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            "{op.acknowledgement.feedback}"
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>⏳ Awaiting Receipt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 4: TODAY'S IMPACT */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>🌟 Today's Impact</h2>
            <p>Real-time community impact metrics calculated today</p>
          </div>
        </div>

        <div className="impact-grid">
          <div className="impact-card">
            <div className="impact-icon">🍱</div>
            <div className="impact-value">{impact.mealsDonated}</div>
            <div className="impact-label">Meals Donated</div>
          </div>

          <div className="impact-card">
            <div className="impact-icon">📦</div>
            <div className="impact-value">{impact.mealsDelivered}</div>
            <div className="impact-label">Meals Delivered</div>
          </div>

          <div className="impact-card">
            <div className="impact-icon">✅</div>
            <div className="impact-value">{impact.requestsFulfilled}</div>
            <div className="impact-label">Requests Fulfilled</div>
          </div>

          <div className="impact-card">
            <div className="impact-icon">❤️</div>
            <div className="impact-value">{impact.activeDonors}</div>
            <div className="impact-label">Active Donors</div>
          </div>

          <div className="impact-card">
            <div className="impact-icon">🤝</div>
            <div className="impact-value">{impact.activeBeneficiaries}</div>
            <div className="impact-label">Active Beneficiaries</div>
          </div>
        </div>
      </div>

      {/* SECTION 5: ADMIN BENEFICIARIES MANAGEMENT MODULE */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>🏛️ Admin Beneficiaries Management Module</h2>
            <p>Manage recipient organizations (Orphanages, Children Homes, Shelters, NGOs, Old-Age Homes), verify eligibility & track fulfillment history</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAddBenModal}>
            + Add Beneficiary Organization
          </button>
        </div>

        {/* BENEFICIARIES MULTI-PARAMETER FILTER TOOLBAR */}
        <div className="multi-filter-bar">
          <div className="filter-group">
            <label>Search Beneficiaries</label>
            <input
              type="text"
              placeholder="Organization, Contact, Phone, City..."
              value={benSearch}
              onChange={(e) => setBenSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select value={benCategoryFilter} onChange={(e) => setBenCategoryFilter(e.target.value)}>
              <option value="ALL">All Categories</option>
              <option value="Orphanage">Orphanage</option>
              <option value="Children's Home">Children's Home</option>
              <option value="Shelter">Shelter</option>
              <option value="NGO">NGO</option>
              <option value="Community Center">Community Center</option>
              <option value="Old-Age Home">Old-Age Home</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Verification Status</label>
            <select value={benVerificationFilter} onChange={(e) => setBenVerificationFilter(e.target.value)}>
              <option value="ALL">All Verification Statuses</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Account Status</label>
            <select value={benAccountFilter} onChange={(e) => setBenAccountFilter(e.target.value)}>
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        {/* BENEFICIARIES TABLE */}
        <div className="table-wrapper">
          {beneficiaries.length === 0 ? (
            <div className="empty-state">
              <p>No beneficiary organizations match current filters.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Beneficiary ID</th>
                  <th>Organization & Category</th>
                  <th>Location & Contact</th>
                  <th>People Served</th>
                  <th>Current Requirements</th>
                  <th>Verification Status</th>
                  <th>Account Status</th>
                  <th>Previous Fulfillments</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaries.map((ben) => (
                  <tr key={ben.id}>
                    <td>
                      <span className="request-id-badge">{ben.beneficiaryId || `#${ben.id.slice(-6)}`}</span>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-name">{ben.organizationName}</span>
                        <span className="org-name">🏷️ {ben.category}</span>
                      </div>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <span>📍 {ben.location}, {ben.city}</span>
                        <span className="org-name">📞 {ben.phone} ({ben.contactPerson})</span>
                      </div>
                    </td>
                    <td>
                      <span className="meals-pill">👥 {ben.peopleServed} people</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: ben.currentRequirementsCount > 0 ? '#d97706' : '#64748b' }}>
                        📋 {ben.currentRequirementsCount || 0} open reqs
                      </span>
                    </td>
                    <td>{getVerificationBadge(ben.verificationStatus)}</td>
                    <td>{getAccountBadge(ben.accountStatus)}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#059669' }}>
                        🍱 {ben.previousDonationsCount || 0} donations
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => handleViewBeneficiaryDetail(ben.id)}
                        >
                          👁️ View
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleOpenEditBenModal(ben)}
                        >
                          ✏️ Edit
                        </button>

                        {ben.verificationStatus === 'PENDING_VERIFICATION' && (
                          <>
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => handleVerifyBeneficiary(ben.id)}
                            >
                              ✅ Verify
                            </button>
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => handleOpenRejectBenModal(ben)}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}

                        <button
                          className={`btn ${ben.accountStatus === 'ACTIVE' ? 'btn-warning' : 'btn-success'} btn-xs`}
                          onClick={() => handleToggleBeneficiaryStatus(ben.id)}
                        >
                          {ben.accountStatus === 'ACTIVE' ? '⏸️ Deactivate' : '▶️ Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 6: ADMIN VOLUNTEERS MANAGEMENT MODULE */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>🙋‍♂️ Admin Volunteers Management Module</h2>
            <p>Manage delivery personnel, track real-time availability states, assign tasks & monitor delivery metrics</p>
          </div>
        </div>

        {/* VOLUNTEERS MULTI-PARAMETER FILTER TOOLBAR */}
        <div className="multi-filter-bar">
          <div className="filter-group">
            <label>Search Volunteers</label>
            <input
              type="text"
              placeholder="Name, Phone, Email, Vehicle No..."
              value={volSearch}
              onChange={(e) => setVolSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Verification Status</label>
            <select value={volVerificationFilter} onChange={(e) => setVolVerificationFilter(e.target.value)}>
              <option value="ALL">All Verification Statuses</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Availability Status</label>
            <select value={volAvailabilityFilter} onChange={(e) => setVolAvailabilityFilter(e.target.value)}>
              <option value="ALL">All Availability States</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="ON_DELIVERY">ON_DELIVERY</option>
              <option value="OFFLINE">OFFLINE / UNAVAILABLE</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Account Status</label>
            <select value={volAccountFilter} onChange={(e) => setVolAccountFilter(e.target.value)}>
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        {/* VOLUNTEERS TABLE */}
        <div className="table-wrapper">
          {volunteers.length === 0 ? (
            <div className="empty-state">
              <p>No delivery volunteers match current filters.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Volunteer Name & Contact</th>
                  <th>Vehicle Details</th>
                  <th>Verification Status</th>
                  <th>Availability Status</th>
                  <th>Current Assignment</th>
                  <th>Completed Deliveries</th>
                  <th>Cancelled Deliveries</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((vol) => (
                  <tr key={vol.id}>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-name">{vol.name}</span>
                        <span className="org-name">📞 {vol.phone} | ✉️ {vol.email}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{vol.vehicleType || 'Two Wheeler'}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>🚗 {vol.vehicleNumber || 'TS 09 EQ 4521'}</div>
                      </div>
                    </td>
                    <td>{getVerificationBadge(vol.verificationStatus)}</td>
                    <td>{getAvailabilityBadge(vol.availabilityStatus)}</td>
                    <td>
                      {vol.currentAssignment ? (
                        <div>
                          <strong style={{ color: '#2563eb' }}>{vol.currentAssignment.deliveryId}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                            📍 {vol.currentAssignment.pickupLocation} ➔ {vol.currentAssignment.deliveryLocation}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No active task</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#059669' }}>
                        🎉 {vol.completedDeliveriesCount || 0} completed
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: vol.cancelledDeliveriesCount > 0 ? '#dc2626' : '#94a3b8' }}>
                        🚫 {vol.cancelledDeliveriesCount || 0} cancelled
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => handleViewVolunteerDetail(vol.id)}
                        >
                          👁️ Profile & History
                        </button>
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => handleOpenAssignVolModal(vol)}
                        >
                          🚚 Assign Task
                        </button>

                        {vol.verificationStatus === 'PENDING_VERIFICATION' && (
                          <>
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => handleVerifyVolunteer(vol.id)}
                            >
                              ✅ Verify
                            </button>
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => handleOpenRejectVolModal(vol)}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}

                        <button
                          className={`btn ${vol.accountStatus === 'ACTIVE' ? 'btn-warning' : 'btn-success'} btn-xs`}
                          onClick={() => handleToggleVolunteerStatus(vol.id)}
                        >
                          {vol.accountStatus === 'ACTIVE' ? '⏸️ Deactivate' : '▶️ Activate'}
                        </button>

                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleToggleVolunteerAvailability(vol)}
                        >
                          🔄 {vol.availabilityStatus === 'OFFLINE' ? 'Set Online' : 'Set Offline'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 7: ADMIN VEHICLES MANAGEMENT MODULE */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>🚗 Admin Vehicles Management Module</h2>
            <p>Manage transport vehicles, meal capacities, driver links & capacity-validated delivery assignment</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAddVehModal}>
            + Add Transport Vehicle
          </button>
        </div>

        {/* VEHICLES MULTI-PARAMETER FILTER TOOLBAR */}
        <div className="multi-filter-bar">
          <div className="filter-group">
            <label>Search Vehicles</label>
            <input
              type="text"
              placeholder="Reg Number, Type, Driver, City..."
              value={vehSearch}
              onChange={(e) => setVehSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Vehicle Type</label>
            <select value={vehTypeFilter} onChange={(e) => setVehTypeFilter(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="Two Wheeler">Two Wheeler</option>
              <option value="Three Wheeler">Three Wheeler</option>
              <option value="Four Wheeler">Four Wheeler</option>
              <option value="Mini Truck">Mini Truck</option>
              <option value="Van">Van</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Operational Status</label>
            <select value={vehStatusFilter} onChange={(e) => setVehStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_USE">IN_USE</option>
              <option value="UNAVAILABLE">UNAVAILABLE</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Account Status</label>
            <select value={vehAccountFilter} onChange={(e) => setVehAccountFilter(e.target.value)}>
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        {/* VEHICLES TABLE */}
        <div className="table-wrapper">
          {vehicles.length === 0 ? (
            <div className="empty-state">
              <p>No transport vehicles match current filters.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vehicle ID & Registration</th>
                  <th>Type & Capacity</th>
                  <th>Operational Status</th>
                  <th>Account Status</th>
                  <th>Assigned Driver</th>
                  <th>Current Delivery</th>
                  <th>Usage Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((veh) => (
                  <tr key={veh.id}>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-name">{veh.vehicleNumber}</span>
                        <span className="org-name">🆔 {veh.vehicleId || `#${veh.id.slice(-6)}`}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{veh.vehicleType}</strong>
                        <div>
                          <span className="meals-pill">📦 Capacity: {veh.capacity} meals</span>
                        </div>
                      </div>
                    </td>
                    <td>{getVehicleStatusBadge(veh.status)}</td>
                    <td>{getAccountBadge(veh.accountStatus)}</td>
                    <td>
                      {veh.assignedVolunteerName ? (
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                          🙋‍♂️ {veh.assignedVolunteerName}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned Driver</span>
                      )}
                    </td>
                    <td>
                      {veh.currentDeliveryDetails ? (
                        <div>
                          <strong style={{ color: '#2563eb' }}>{veh.currentDeliveryDetails.deliveryId}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {veh.currentDeliveryDetails.numberOfMeals} meals
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No active task</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#059669' }}>
                        🚚 {veh.usageHistoryCount || 0} deliveries
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => handleViewVehicleDetail(veh.id)}
                        >
                          👁️ Details & History
                        </button>
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => handleOpenAssignVehModal(veh)}
                        >
                          🚚 Assign to Delivery
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleOpenEditVehModal(veh)}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          className={`btn ${veh.accountStatus === 'ACTIVE' ? 'btn-warning' : 'btn-success'} btn-xs`}
                          onClick={() => handleToggleVehicleStatus(veh.id)}
                        >
                          {veh.accountStatus === 'ACTIVE' ? '⏸️ Deactivate' : '▶️ Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION: ADMIN DELIVERY ASSIGNMENT MODULE */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>🚚 Admin Delivery Assignment Module</h2>
            <p>Triggered when donor requests volunteer collection & delivery (VOLUNTEER_PICKUP). Assign available verified volunteers and capacity-compatible transport vehicles.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-submitted" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
              ⏳ {pendingAssignments.length} Pending Assignments
            </span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="multi-filter-bar">
          <div className="filter-group" style={{ flex: 1 }}>
            <label>Search Pending Requests</label>
            <input
              type="text"
              placeholder="Search by Delivery ID, Donor, Recipient, Location..."
              value={pendingAssignSearch}
              onChange={(e) => setPendingAssignSearch(e.target.value)}
            />
          </div>
        </div>

        {/* PENDING ASSIGNMENTS TABLE */}
        <div className="table-wrapper">
          {pendingAssignments.length === 0 ? (
            <div className="empty-state">
              <p>🎉 No pending delivery requests requiring volunteer & vehicle allocation.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Delivery ID</th>
                  <th>Donor & Pickup</th>
                  <th>Recipient / Beneficiary</th>
                  <th>Food Quantity</th>
                  <th>Required Delivery Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAssignments.map((pa) => (
                  <tr key={pa.id}>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{pa.deliveryId}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Method: {pa.deliveryMethod}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{pa.donorName}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>📍 {pa.pickupLocation || 'Pickup Unspecified'}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{pa.customerName}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>📍 {pa.deliveryLocation || 'Delivery Unspecified'}</div>
                      </div>
                    </td>
                    <td>
                      <span className="meals-pill">🍱 {pa.numberOfMeals} meals</span>
                    </td>
                    <td>
                      <div>
                        <strong>📅 {pa.requiredDeliveryDate || 'Today'}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>⏰ {pa.requiredDeliveryTime || '14:00'}</div>
                      </div>
                    </td>
                    <td>{getDeliveryStatusBadge(pa.status, pa.isDelayed)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => handleOpenAssignResourcesModal(pa)}
                        >
                          🚚 Assign Volunteer & Vehicle
                        </button>
                        <button
                          className="btn btn-warning btn-xs"
                          onClick={() => handleCancelDeliveryAssignmentHandler(pa.id)}
                        >
                          ❌ Cancel Request
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION: ADMIN DELIVERIES MANAGEMENT MODULE */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>📦 Admin Deliveries Management Module</h2>
            <p>Monitor real-time lifecycle progression across all active, completed, cancelled, and delayed deliveries.</p>
          </div>
        </div>

        {/* DELIVERIES FILTER TOOLBAR */}
        <div className="multi-filter-bar">
          <div className="filter-group">
            <label>Filter Lifecycle Stage</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-xs ${delFilterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDelFilterType('ALL')}
              >
                All ({delStats.total})
              </button>
              <button
                className={`btn btn-xs ${delFilterType === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDelFilterType('ACTIVE')}
              >
                Active ({delStats.active})
              </button>
              <button
                className={`btn btn-xs ${delFilterType === 'COMPLETED' ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => setDelFilterType('COMPLETED')}
              >
                Completed ({delStats.completed})
              </button>
              <button
                className={`btn btn-xs ${delFilterType === 'CANCELLED' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setDelFilterType('CANCELLED')}
              >
                Cancelled ({delStats.cancelled})
              </button>
              <button
                className={`btn btn-xs ${delFilterType === 'DELAYED' ? 'btn-warning' : 'btn-secondary'}`}
                onClick={() => setDelFilterType('DELAYED')}
              >
                Delayed ({delStats.delayed})
              </button>
            </div>
          </div>

          <div className="filter-group" style={{ flex: 1 }}>
            <label>Search Deliveries</label>
            <input
              type="text"
              placeholder="Search by ID, Donor, Recipient, Volunteer, Vehicle..."
              value={delSearch}
              onChange={(e) => setDelSearch(e.target.value)}
            />
          </div>
        </div>

        {/* DELIVERIES TABLE */}
        <div className="table-wrapper">
          {deliveries.length === 0 ? (
            <div className="empty-state">
              <p>No deliveries found for current filters.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Delivery ID</th>
                  <th>Donor</th>
                  <th>Recipient / Beneficiary</th>
                  <th>Route (Pickup → Drop)</th>
                  <th>Food</th>
                  <th>Volunteer & Vehicle</th>
                  <th>Current Status</th>
                  <th>Created & Delivery Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((del) => (
                  <tr key={del.id}>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{del.deliveryId}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {del.deliveryMethod === 'DONOR_SELF_DROP' ? '🚗 Donor Self-Drop' : '🛵 Volunteer Pickup'}
                      </div>
                    </td>
                    <td>
                      <strong>{del.donorName}</strong>
                    </td>
                    <td>
                      <strong>{del.customerName}</strong>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        <div>🚩 <strong>From:</strong> {del.pickupLocation || 'N/A'}</div>
                        <div>🏁 <strong>To:</strong> {del.deliveryLocation || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <span className="meals-pill">🍱 {del.numberOfMeals} meals</span>
                    </td>
                    <td>
                      <div>
                        {del.volunteerName ? (
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>🙋‍♂️ {del.volunteerName}</div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned Volunteer</span>
                        )}
                        {del.vehicleNumber && (
                          <div style={{ fontSize: '0.8rem', color: '#475569' }}>🚗 {del.vehicleNumber}</div>
                        )}
                      </div>
                    </td>
                    <td>{getDeliveryStatusBadge(del.status, del.isDelayed)}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        <div>Created: {formatDate(del.createdAt)}</div>
                        {del.completedAt ? (
                          <div style={{ color: '#059669', fontWeight: 600 }}>Done: {formatDate(del.completedAt)}</div>
                        ) : (
                          <div style={{ color: '#d97706' }}>Req: {del.requiredDeliveryDate || 'Today'}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => handleOpenDeliveryDetail(del.id)}
                        >
                          👁️ Lifecycle
                        </button>
                        {del.status !== 'COMPLETED' && del.status !== 'CANCELLED' && (
                          <>
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={() => handleOpenStatusProgressionModal(del)}
                            >
                              🔄 Advance Status
                            </button>
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => handleOpenAssignResourcesModal(del)}
                            >
                              ✏️ Reassign
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION: ADMIN EXCEPTION HANDLING & PARTIAL FULFILLMENT MODULE */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>🚨 Admin Exception Handling & Partial Fulfillment</h2>
            <p>Resolve volunteer task rejections, partial meal fulfillments, donor/recipient cancellations, and delivery delays.</p>
          </div>
        </div>

        {/* WIDGET 1: PARTIAL FULFILLMENT CALCULATOR & WIDGET 2: REASSIGNMENT QUEUE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
          {/* Partial Fulfillment Widget */}
          <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1e293b' }}>
              ⚖️ Partial Meal Fulfillment Calculator
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
              When a donor provides partial meals (e.g. 60 meals for a 100 meal requirement), the fulfilled portion moves to delivery while the remaining 40 meals stay open for other donors.
            </p>

            <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Select Request</label>
                <select
                  className="form-control"
                  style={{ fontSize: '0.8rem' }}
                  onChange={(e) => {
                    const req = requests.find((r) => r.id === e.target.value);
                    setPartialTargetRequest(req);
                  }}
                >
                  <option value="">-- Select Food Requirement --</option>
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestId} — {r.customerName} ({r.numberOfMeals} meals)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Select Available Donation</label>
                <select
                  className="form-control"
                  style={{ fontSize: '0.8rem' }}
                  onChange={(e) => {
                    const don = donations.find((d) => d.id === e.target.value);
                    setPartialTargetDonation(don);
                  }}
                >
                  <option value="">-- Select Available Donation --</option>
                  {donations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.donationId} — {d.donorName} ({d.numberOfMeals} meals)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {partialTargetRequest && partialTargetDonation && (
              <div style={{ background: '#ecfdf5', padding: '0.8rem', borderRadius: '6px', border: '1px solid #a7f3d0', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Requirement: <strong>{partialTargetRequest.numberOfMeals} meals</strong></span>
                  <span>Donor Supply: <strong>{partialTargetDonation.numberOfMeals} meals</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: '#065f46', marginTop: '0.4rem' }}>
                  <span>Fulfilled: {Math.min(partialTargetRequest.numberOfMeals, partialTargetDonation.numberOfMeals)} meals</span>
                  <span>Remaining: {Math.max(0, partialTargetRequest.numberOfMeals - partialTargetDonation.numberOfMeals)} meals (Stays Open)</span>
                </div>
                <button
                  className="btn btn-success btn-xs"
                  style={{ width: '100%', marginTop: '0.6rem' }}
                  onClick={() => handleOpenPartialFulfillModal(partialTargetDonation, partialTargetRequest)}
                >
                  ⚡ Execute Partial Fulfillment Match
                </button>
              </div>
            )}
          </div>

          {/* Volunteer Task Rejection Reassignment Queue Widget */}
          <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1e293b' }}>
              🔄 Rejection Queue (Pending Reassignment)
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.8rem' }}>
              Deliveries where volunteers rejected assignment. Allocate another available volunteer and capacity vehicle.
            </p>

            {deliveries.filter((d) => d.status === 'PENDING_REASSIGNMENT').length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#059669', fontStyle: 'italic', background: '#ecfdf5', padding: '0.8rem', borderRadius: '6px' }}>
                ✅ No rejected deliveries currently pending reassignment.
              </div>
            ) : (
              <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
                {deliveries
                  .filter((d) => d.status === 'PENDING_REASSIGNMENT')
                  .map((rd) => (
                    <div
                      key={rd.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#ffffff',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '6px',
                        marginBottom: '0.5rem',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      <div>
                        <strong style={{ color: '#dc2626' }}>{rd.deliveryId}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                          {rd.customerName} ({rd.numberOfMeals} meals)
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => handleOpenAssignResourcesModal(rd)}
                      >
                        🚚 Reassign Volunteer
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: ADMIN USERS MANAGEMENT MODULE */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>👥 Admin Users Management Module</h2>
            <p>Manage platform accounts across CUSTOMER, DONOR, VOLUNTEER, and ADMIN roles. Toggle account status and manage role permissions.</p>
          </div>
          <div>
            <span className="badge badge-verified" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
              Total Users: {userStats.total}
            </span>
          </div>
        </div>

        {/* USERS FILTER TOOLBAR */}
        <div className="multi-filter-bar">
          <div className="filter-group">
            <label>Filter Role</label>
            <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
              <option value="ALL">All Roles ({userStats.total})</option>
              <option value="CUSTOMER">CUSTOMERS ({userStats.customers})</option>
              <option value="DONOR">DONORS ({userStats.donors})</option>
              <option value="VOLUNTEER">VOLUNTEERS ({userStats.volunteers})</option>
              <option value="ADMIN">ADMINS ({userStats.admins})</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Account Status</label>
            <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE ({userStats.active})</option>
              <option value="INACTIVE">INACTIVE ({userStats.inactive})</option>
            </select>
          </div>

          <div className="filter-group" style={{ flex: 1 }}>
            <label>Search Users</label>
            <input
              type="text"
              placeholder="Name, Email, Phone, City, Organization..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
        </div>

        {/* USERS TABLE */}
        <div className="table-wrapper">
          {usersList.length === 0 ? (
            <div className="empty-state">
              <p>No users found matching current filters.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID & Name</th>
                  <th>Contact Info</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Verification</th>
                  <th>Activity Summary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div>
                        <strong>{u.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          🆔 {u.email.split('@')[0]}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>📧 {u.email}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📞 {u.phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-rejected' : u.role === 'VOLUNTEER' ? 'badge-delivery_arranged' : 'badge-verified'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{getAccountBadge(u.accountStatus)}</td>
                    <td>{getVerificationBadge(u.verificationStatus || 'VERIFIED')}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        {u.role === 'CUSTOMER' && <div>📋 Requests: <strong>{u.activitySummary?.requestsCount || 0}</strong></div>}
                        {u.role === 'DONOR' && <div>🍱 Donations: <strong>{u.activitySummary?.donationsCount || 0}</strong></div>}
                        {u.role === 'VOLUNTEER' && <div>🚚 Deliveries: <strong>{u.activitySummary?.deliveriesCount || 0}</strong></div>}
                        {u.role === 'ADMIN' && <div>🛡️ System Admin</div>}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => handleViewUserProfile(u.id)}
                        >
                          👁️ Profile
                        </button>
                        <button
                          className={`btn ${u.accountStatus === 'ACTIVE' ? 'btn-warning' : 'btn-success'} btn-xs`}
                          onClick={() => handleToggleUserStatus(u.id)}
                        >
                          {u.accountStatus === 'ACTIVE' ? '⏸️ Deactivate' : '▶️ Activate'}
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleOpenEditRoleModal(u)}
                        >
                          ✏️ Role
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION: ADMIN NOTIFICATIONS CENTER */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>🔔 Admin Notifications Center</h2>
            <p>Real-time operational alerts for new requests, donations, volunteer rejections, delays, and completions.</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleMarkAllNotifsRead}>
            ✓ Mark All Read ({unreadNotifCount} Unread)
          </button>
        </div>

        {/* NOTIFICATIONS TABLE */}
        <div className="table-wrapper">
          {notificationsList.length === 0 ? (
            <div className="empty-state">
              <p>🎉 No notifications found.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Title & Notification ID</th>
                  <th>Message</th>
                  <th>Category / Type</th>
                  <th>Related Entity ID</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {notificationsList.map((n) => (
                  <tr key={n.id} style={{ background: n.isRead ? '#ffffff' : '#f0fdf4' }}>
                    <td>
                      {n.isRead ? (
                        <span className="badge badge-open">🟢 Read</span>
                      ) : (
                        <span className="badge badge-rejected" style={{ fontWeight: 700 }}>🔴 UNREAD</span>
                      )}
                    </td>
                    <td>
                      <div>
                        <strong>{n.title}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>🆔 {n.notificationId}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#334155' }}>{n.message}</div>
                    </td>
                    <td>
                      <span className="badge badge-submitted">{n.type}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{n.relatedEntityId || 'System'}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(n.createdAt)}</span>
                    </td>
                    <td>
                      {!n.isRead && (
                        <button
                          className="btn btn-success btn-xs"
                          onClick={() => handleMarkNotifRead(n.id)}
                        >
                          ✓ Mark Read
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION: ADMIN REPORTS & ISSUES MODULE */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>⚠️ Admin Reports & Issues Management</h2>
            <p>Track user-reported operational issues (Food Quality, Incorrect Quantity, Delivery Issues, Donor/Volunteer Issues).</p>
          </div>
        </div>

        {/* REPORTS FILTER TOOLBAR */}
        <div className="multi-filter-bar">
          <div className="filter-group">
            <label>Filter Status</label>
            <select value={reportStatusFilter} onChange={(e) => setReportStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses ({reportStats.total})</option>
              <option value="OPEN">OPEN ({reportStats.open})</option>
              <option value="INVESTIGATING">INVESTIGATING ({reportStats.investigating})</option>
              <option value="RESOLVED">RESOLVED ({reportStats.resolved})</option>
              <option value="CLOSED">CLOSED ({reportStats.closed})</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority</label>
            <select value={reportPriorityFilter} onChange={(e) => setReportPriorityFilter(e.target.value)}>
              <option value="ALL">All Priorities</option>
              <option value="URGENT">URGENT ({reportStats.urgent})</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="filter-group" style={{ flex: 1 }}>
            <label>Search Reports</label>
            <input
              type="text"
              placeholder="Search Report ID, Reporter, Description..."
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
            />
          </div>
        </div>

        {/* REPORTS TABLE */}
        <div className="table-wrapper">
          {reportsList.length === 0 ? (
            <div className="empty-state">
              <p>No issue reports match current filters.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Reporter</th>
                  <th>Issue Type & Priority</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reportsList.map((rep) => (
                  <tr key={rep.id}>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{rep.reportId}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{rep.reporterName}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Role: {rep.reporterRole}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="badge badge-submitted">{rep.issueType}</span>
                        <div style={{ marginTop: '0.2rem' }}>
                          <span className={`badge ${rep.priority === 'URGENT' ? 'badge-rejected' : rep.priority === 'HIGH' ? 'badge-cancelled' : 'badge-open'}`}>
                            {rep.priority}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', maxWidth: '280px' }}>{rep.description}</div>
                    </td>
                    <td>
                      <span className={`badge ${rep.status === 'RESOLVED' ? 'badge-verified' : rep.status === 'INVESTIGATING' ? 'badge-donor_matched' : 'badge-submitted'}`}>
                        {rep.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(rep.createdAt)}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => handleOpenReportDetail(rep)}
                      >
                        👁️ Investigate & Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION: ADMIN ANALYTICS & PERFORMANCE DASHBOARD */}
      {analyticsData && (
        <div className="section-card">
          <div className="section-title">
            <div>
              <h2>📊 Admin Analytics & Operational Performance</h2>
              <p>Calculated directly from live database metrics across customizable timeframes.</p>
            </div>
            {/* TIMEFRAME SELECTOR */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['today', 'week', 'month'].map((tf) => (
                <button
                  key={tf}
                  className={`btn btn-xs ${analyticsTimeframe === tf ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAnalyticsTimeframe(tf)}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* INDICATOR CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a' }}>{analyticsData.metrics.totalMealsDonated}</div>
              <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600 }}>Total Meals Donated</div>
            </div>
            <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>{analyticsData.metrics.totalMealsDelivered}</div>
              <div style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 600 }}>Total Meals Delivered</div>
            </div>
            <div style={{ background: '#faf5ff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9d5ff', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#9333ea' }}>{analyticsData.metrics.totalFulfilledRequests} / {analyticsData.metrics.totalFoodRequests}</div>
              <div style={{ fontSize: '0.8rem', color: '#7e22ce', fontWeight: 600 }}>Fulfilled Requests</div>
            </div>
            <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '8px', border: '1px solid #fed7aa', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ea580c' }}>{analyticsData.metrics.cancellationRate}%</div>
              <div style={{ fontSize: '0.8rem', color: '#c2410c', fontWeight: 600 }}>Cancellation Rate</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{analyticsData.metrics.avgDeliveryTimeMins} mins</div>
              <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Avg Delivery Time</div>
            </div>
          </div>

          {/* VISUAL CSS CHARTS & CATEGORY BREAKDOWN GAUGES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
            {/* Meals Donated vs Delivered Trend Bar Chart */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#334155' }}>📈 7-Day Meals Donated vs Delivered Trend</h4>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', padding: '0 0.5rem', borderBottom: '2px solid #cbd5e1' }}>
                {analyticsData.trendsOverTime.map((item, idx) => {
                  const maxVal = 200;
                  const hDon = Math.min(130, Math.round((item.donatedMeals / maxVal) * 130));
                  const hDel = Math.min(130, Math.round((item.deliveredMeals / maxVal) * 130));

                  return (
                    <div key={idx} style={{ textAlign: 'center', flex: 1, margin: '0 2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '3px', height: '130px' }}>
                        <div
                          title={`Donated: ${item.donatedMeals}`}
                          style={{
                            width: '12px',
                            height: `${hDon}px`,
                            background: '#16a34a',
                            borderRadius: '3px 3px 0 0',
                          }}
                        ></div>
                        <div
                          title={`Delivered: ${item.deliveredMeals}`}
                          style={{
                            width: '12px',
                            height: `${hDel}px`,
                            background: '#2563eb',
                            borderRadius: '3px 3px 0 0',
                          }}
                        ></div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.3rem' }}>{item.label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.8rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>🟢 Meals Donated</span>
                <span style={{ color: '#2563eb', fontWeight: 600 }}>🔵 Meals Delivered</span>
              </div>
            </div>

            {/* Food Category Percentage Gauges */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#334155' }}>🍱 Donations by Food Category</h4>
              {Object.entries(analyticsData.categoryCounts).map(([cat, cnt]) => {
                const totalCat = Object.values(analyticsData.categoryCounts).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((cnt / totalCat) * 100);

                return (
                  <div key={cat} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600 }}>{cat}</span>
                      <span style={{ color: '#64748b' }}>{cnt} meals ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', background: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          background: cat === 'Cooked' ? '#2563eb' : cat === 'Bakery' ? '#d97706' : cat === 'Packaged' ? '#059669' : '#8b5cf6',
                          height: '100%',
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: ADMIN ACTIVITY AUDIT LOGS MODULE */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>📜 Admin Activity Audit Logs Module</h2>
            <p>Append-only audit trail capturing every system action across all roles.</p>
          </div>
        </div>

        {/* ACTIVITY LOGS FILTER TOOLBAR */}
        <div className="multi-filter-bar">
          <div className="filter-group">
            <label>Filter Actor Role</label>
            <select value={logRoleFilter} onChange={(e) => setLogRoleFilter(e.target.value)}>
              <option value="ALL">All Roles</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="ADMIN">ADMIN</option>
              <option value="DONOR">DONOR</option>
              <option value="VOLUNTEER">VOLUNTEER</option>
              <option value="CUSTOMER">CUSTOMER</option>
            </select>
          </div>

          <div className="filter-group" style={{ flex: 1 }}>
            <label>Search Audit Logs</label>
            <input
              type="text"
              placeholder="Search by Log ID, Actor, Action, Details, Entity ID..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
            />
          </div>
        </div>

        {/* LOGS TABLE */}
        <div className="table-wrapper">
          {activityLogsList.length === 0 ? (
            <div className="empty-state">
              <p>No activity logs match current filters.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Actor (Name & Role)</th>
                  <th>Action Type</th>
                  <th>Related Entity ID</th>
                  <th>Status Transition</th>
                  <th>Action Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {activityLogsList.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <strong style={{ color: '#2563eb' }}>{log.logId}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{log.actorName}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Role: {log.actorRole}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-submitted">{log.actionType}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#059669' }}>{log.relatedEntityId || 'System'}</strong>
                    </td>
                    <td>
                      {log.previousStatus || log.newStatus ? (
                        <div style={{ fontSize: '0.8rem' }}>
                          <span style={{ color: '#64748b' }}>{log.previousStatus || 'INIT'}</span> $\rightarrow${' '}
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>{log.newStatus}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', maxWidth: '250px' }}>{log.details}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(log.timestamp)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 8: ADMIN DONATIONS MODULE */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>🍱 Admin Donations Management Module</h2>
            <p>View all donations created by DONORS (Direct & Request Fulfillments) and assign beneficiaries</p>
          </div>
        </div>

        {/* DONATIONS MULTI-PARAMETER FILTER TOOLBAR */}
        <div className="multi-filter-bar">
          <div className="filter-group">
            <label>Search Donations</label>
            <input
              type="text"
              placeholder="Donation ID, Donor, Location, Food..."
              value={donSearch}
              onChange={(e) => setDonSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Status Filter</label>
            <select value={donStatusFilter} onChange={(e) => setDonStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses ({donStats.total})</option>
              <option value="SUBMITTED">SUBMITTED ({donStats.submitted})</option>
              <option value="VERIFIED">VERIFIED / AVAILABLE ({donStats.verified})</option>
              <option value="MATCHED">MATCHED ({donStats.matched})</option>
              <option value="COMPLETED">COMPLETED ({donStats.completed})</option>
              <option value="FLAGGED">FLAGGED ({donStats.flagged})</option>
              <option value="CANCELLED">CANCELLED ({donStats.cancelled})</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Donation Origin</label>
            <select value={donOriginFilter} onChange={(e) => setDonOriginFilter(e.target.value)}>
              <option value="ALL">All Origins</option>
              <option value="DIRECT_DONATION">Direct Donation (Spontaneous)</option>
              <option value="REQUEST_FULFILLMENT">Request Fulfillment</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Food Type</label>
            <select value={donFoodTypeFilter} onChange={(e) => setDonFoodTypeFilter(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="Both">Both</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Food Category</label>
            <select value={donCategoryFilter} onChange={(e) => setDonCategoryFilter(e.target.value)}>
              <option value="ALL">All Categories</option>
              <option value="Cooked">Cooked</option>
              <option value="Raw/Groceries">Raw/Groceries</option>
              <option value="Packaged">Packaged</option>
              <option value="Bakery">Bakery</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* DONATIONS DATA TABLE (11 DISPLAY COLUMNS) */}
        <div className="table-wrapper">
          {donations.length === 0 ? (
            <div className="empty-state">
              <p>No donations match current filters. Click "Seed Demo Operations" to populate live donations.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Donation ID</th>
                  <th>Donor</th>
                  <th>Meals Quantity</th>
                  <th>Food Type</th>
                  <th>Category</th>
                  <th>Available Date</th>
                  <th>Available Time</th>
                  <th>Pickup Location</th>
                  <th>Current Beneficiary / Request</th>
                  <th>Delivery Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((don) => (
                  <tr key={don.id}>
                    <td>
                      <span className="request-id-badge">{don.donationId || `#${don.id.slice(-6)}`}</span>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-name">{don.donorName}</span>
                        <span className="org-name">📞 {don.phone}</span>
                      </div>
                    </td>
                    <td>
                      <span className="meals-pill">{don.numberOfMeals} meals</span>
                    </td>
                    <td>
                      <span>{don.foodType === 'Veg' ? '🥗 Veg' : don.foodType === 'Non-Veg' ? '🍗 Non-Veg' : '🍲 Both'}</span>
                    </td>
                    <td>{don.foodCategory}</td>
                    <td>{formatDate(don.availableDate)}</td>
                    <td>⏱️ {don.availableTime}</td>
                    <td>📍 {don.pickupLocation}</td>
                    <td>
                      {don.matchedBeneficiary?.customerName ? (
                        <div className="customer-cell">
                          <span className="customer-name">🏛️ {don.matchedBeneficiary.customerName}</span>
                          <span className="org-name">{don.matchedBeneficiary.requestId}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Awaiting Beneficiary</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                        {don.deliveryMethod === 'VOLUNTEER_PICKUP' ? '🚚 Volunteer Pickup' : don.deliveryMethod === 'DONOR_SELF_DROP' ? '🚗 Donor Self-Drop' : '📦 Courier'}
                      </span>
                    </td>
                    <td>{getStatusBadge(don.status)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => {
                            setSelectedDonation(don);
                            setShowDonDetailModal(true);
                          }}
                        >
                          👁️ View
                        </button>

                        {don.status === 'SUBMITTED' && (
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => handleVerifyDonation(don.id)}
                          >
                            ✅ Verify
                          </button>
                        )}

                        {don.status !== 'MATCHED' && don.status !== 'COMPLETED' && don.status !== 'CANCELLED' && don.status !== 'FLAGGED' && (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => handleOpenAssignModal(don)}
                          >
                            🤝 Assign Beneficiary
                          </button>
                        )}

                        {don.status !== 'FLAGGED' && don.status !== 'CANCELLED' && (
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={() => handleOpenDonationActionModal('FLAG', don)}
                          >
                            🚩 Flag/Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 6: CUSTOMER FOOD REQUIREMENTS MANAGEMENT MODULE */}
      <div className="section-card">
        <div className="section-title">
          <div>
            <h2>📋 Customer Food Requirements Management</h2>
            <p>Track, verify, match donors, and monitor full workflow lifecycle</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewModal(true)}>
            + New Requirement
          </button>
        </div>

        {/* FOOD REQUESTS MULTI-PARAMETER FILTER TOOLBAR */}
        <div className="multi-filter-bar">
          <div className="filter-group">
            <label>Search Requirements</label>
            <input
              type="text"
              placeholder="Request ID, Customer, Location..."
              value={reqSearch}
              onChange={(e) => setReqSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Status Filter</label>
            <select value={reqStatusFilter} onChange={(e) => setReqStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses ({reqStats.total})</option>
              <option value="SUBMITTED">SUBMITTED / PENDING ({reqStats.submitted})</option>
              <option value="VERIFIED">VERIFIED / OPEN ({reqStats.verified})</option>
              <option value="DONOR_MATCHED">DONOR MATCHED ({reqStats.matched})</option>
              <option value="DELIVERED">DELIVERED / COMPLETED ({reqStats.completed})</option>
              <option value="REJECTED">REJECTED ({reqStats.rejected})</option>
              <option value="CANCELLED">CANCELLED ({reqStats.cancelled})</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Required Date</label>
            <input
              type="date"
              value={reqDateFilter}
              onChange={(e) => setReqDateFilter(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Location / City</label>
            <input
              type="text"
              placeholder="e.g. Secunderabad"
              value={reqLocationFilter}
              onChange={(e) => setReqLocationFilter(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Food Type</label>
            <select value={reqFoodTypeFilter} onChange={(e) => setReqFoodTypeFilter(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="Both">Both</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Food Category</label>
            <select value={reqCategoryFilter} onChange={(e) => setReqCategoryFilter(e.target.value)}>
              <option value="ALL">All Categories</option>
              <option value="Cooked">Cooked</option>
              <option value="Raw/Groceries">Raw/Groceries</option>
              <option value="Packaged">Packaged</option>
              <option value="Bakery">Bakery</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* FOOD REQUESTS TABLE */}
        <div className="table-wrapper">
          {requests.length === 0 ? (
            <div className="empty-state">
              <p>No food requirements match current filter.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Customer / Recipient</th>
                  <th>Meals / People</th>
                  <th>Food Type</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Required Date</th>
                  <th>Required Time</th>
                  <th>Current Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <span className="request-id-badge">{req.requestId || `#${req.id.slice(-6)}`}</span>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-name">{req.customerName}</span>
                        {req.organizationName && <span className="org-name">{req.organizationName}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="meals-pill">{req.numberOfMeals} meals</span>
                    </td>
                    <td>
                      <span>{req.foodType === 'Veg' ? '🥗 Veg' : req.foodType === 'Non-Veg' ? '🍗 Non-Veg' : '🍲 Both'}</span>
                    </td>
                    <td>{req.foodCategory}</td>
                    <td>📍 {req.location}</td>
                    <td>{formatDate(req.requiredDate)}</td>
                    <td>⏱️ {req.requiredTime}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>{formatDate(req.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowReqDetailModal(true);
                          }}
                        >
                          👁️ View
                        </button>

                        {req.status !== 'DONOR_MATCHED' && req.status !== 'DELIVERED' && req.status !== 'COMPLETED' && req.status !== 'REJECTED' && req.status !== 'CANCELLED' && (
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => handleOpenMatchModal(req)}
                          >
                            🤝 Match Donor
                          </button>
                        )}

                        {(req.status === 'SUBMITTED' || req.status === 'PENDING') && (
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => handleOpenReqActionModal('APPROVE', req)}
                          >
                            ✅ Verify
                          </button>
                        )}

                        {req.status !== 'REJECTED' && req.status !== 'COMPLETED' && (
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={() => handleOpenReqActionModal('REJECTED', req)}
                          >
                            ❌ Reject
                          </button>
                        )}

                        {req.status !== 'CANCELLED' && req.status !== 'COMPLETED' && (
                          <button
                            className="btn btn-warning btn-xs"
                            onClick={() => handleOpenReqActionModal('CANCELLED', req)}
                          >
                            🚫 Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* VIEW DONATION DETAILS MODAL */}
      {showDonDetailModal && selectedDonation && (
        <div className="modal-overlay" onClick={() => setShowDonDetailModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Donation Details - {selectedDonation.donationId}</h3>
              <button className="close-btn" onClick={() => setShowDonDetailModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Donation ID</span>
                  <span className="detail-value">{selectedDonation.donationId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">{getStatusBadge(selectedDonation.status)}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Donor Name</span>
                  <span className="detail-value">{selectedDonation.donorName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact</span>
                  <span className="detail-value">📞 {selectedDonation.phone} | ✉️ {selectedDonation.email || 'N/A'}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Food Title & Meals</span>
                  <span className="detail-value">{selectedDonation.foodTitle} ({selectedDonation.numberOfMeals} meals)</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type & Category</span>
                  <span className="detail-value">{selectedDonation.foodType} ({selectedDonation.foodCategory})</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Available Window</span>
                  <span className="detail-value">📅 {formatDate(selectedDonation.availableDate)} at ⏱️ {selectedDonation.availableTime}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Delivery Method</span>
                  <span className="detail-value">{selectedDonation.deliveryMethod}</span>
                </div>

                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">Pickup Location</span>
                  <span className="detail-value">📍 {selectedDonation.pickupLocation}</span>
                </div>

                {selectedDonation.matchedBeneficiary?.customerName && (
                  <div className="detail-item" style={{ gridColumn: 'span 2', background: '#ecfdf5', padding: '0.75rem', borderRadius: '8px' }}>
                    <span className="detail-label" style={{ color: '#047857' }}>🏛️ Matched Beneficiary Details</span>
                    <span className="detail-value">
                      <strong>{selectedDonation.matchedBeneficiary.customerName}</strong> ({selectedDonation.matchedBeneficiary.requestId})
                      <div>📞 {selectedDonation.matchedBeneficiary.phone} | 📍 {selectedDonation.matchedBeneficiary.location}</div>
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDonDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN BENEFICIARY MODAL */}
      {showAssignBeneficiaryModal && assigningDonation && (
        <div className="modal-overlay" onClick={() => setShowAssignBeneficiaryModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Beneficiary to Donation - {assigningDonation.donationId}</h3>
              <button className="close-btn" onClick={() => setShowAssignBeneficiaryModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                Assign an open customer food requirement to <strong>{assigningDonation.donorName}</strong>'s donation (
                {assigningDonation.foodTitle}, {assigningDonation.numberOfMeals} meals).
              </p>

              {openRequestsForAssign.length === 0 ? (
                <div className="empty-state">
                  <p>No open customer food requirements available right now.</p>
                </div>
              ) : (
                <div>
                  {openRequestsForAssign.map((req) => (
                    <div key={req.id} className="donation-select-card">
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{req.customerName}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                          📋 {req.requestId} - {req.numberOfMeals} meals ({req.foodType})
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          📍 {req.location} | Required: {req.requiredDate} {req.requiredTime}
                        </div>
                      </div>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleConfirmAssignBeneficiary(req.id)}
                      >
                        Assign Beneficiary
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAssignBeneficiaryModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL DONOR MATCHING MODAL FOR REQUEST */}
      {showMatchModal && matchingRequest && (
        <div className="modal-overlay" onClick={() => setShowMatchModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Match Donor to Requirement - {matchingRequest.requestId}</h3>
              <button className="close-btn" onClick={() => setShowMatchModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                Select an available donation to match with <strong>{matchingRequest.customerName}</strong> (
                {matchingRequest.numberOfMeals} meals).
              </p>

              {availableDonationsList.length === 0 ? (
                <div className="empty-state">
                  <p>No available donations in system right now. Click "Seed Demo Operations" to populate available donations.</p>
                </div>
              ) : (
                <div>
                  {availableDonationsList.map((don) => (
                    <div key={don.id} className="donation-select-card">
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{don.donorName}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                          🍱 {don.foodTitle} ({don.numberOfMeals} meals)
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          📍 {don.pickupLocation} | Phone: {don.phone}
                        </div>
                      </div>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleConfirmMatch(don.id)}
                      >
                        Match This Donor
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMatchModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION CONFIRMATION MODAL */}
      {actionModal.show && (
        <div className="modal-overlay" onClick={() => setActionModal({ show: false, module: '', type: '', item: null })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {actionModal.module === 'DONATION' ? `Flag / Cancel Donation` : `Update Status to ${actionModal.type}`}
              </h3>
              <button className="close-btn" onClick={() => setActionModal({ show: false, module: '', type: '', item: null })}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                Updating {actionModal.module === 'DONATION' ? 'donation' : 'requirement'} <strong>{actionModal.item?.donationId || actionModal.item?.requestId}</strong>.
              </p>

              <div className="form-group">
                <label>Reason *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActionModal({ show: false, module: '', type: '', item: null })}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={
                  actionModal.module === 'DONATION'
                    ? handleConfirmDonationAction
                    : actionModal.module === 'BENEFICIARY_REJECT'
                    ? handleConfirmRejectBeneficiary
                    : actionModal.module === 'VOLUNTEER_REJECT'
                    ? handleConfirmRejectVolunteer
                    : handleConfirmReqAction
                }
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW VOLUNTEER PROFILE & HISTORY MODAL */}
      {showVolDetailModal && selectedVolunteer && (
        <div className="modal-overlay" onClick={() => setShowVolDetailModal(false)}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Volunteer Profile & Task History - {selectedVolunteer.name}</h3>
              <button className="close-btn" onClick={() => setShowVolDetailModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Volunteer Name</span>
                  <span className="detail-value">🙋‍♂️ {selectedVolunteer.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Contact Information</span>
                  <span className="detail-value">📞 {selectedVolunteer.phone} | ✉️ {selectedVolunteer.email}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Verification Status</span>
                  <span className="detail-value">{getVerificationBadge(selectedVolunteer.verificationStatus)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Availability Status</span>
                  <span className="detail-value">{getAvailabilityBadge(selectedVolunteer.availabilityStatus)}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Vehicle Type & Registration</span>
                  <span className="detail-value">🚗 {selectedVolunteer.vehicleType} ({selectedVolunteer.vehicleNumber || 'N/A'})</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">City / Operating Zone</span>
                  <span className="detail-value">📍 {selectedVolunteer.city || 'Hyderabad'}</span>
                </div>

                {selectedVolunteer.rejectionReason && (
                  <div className="detail-item" style={{ gridColumn: 'span 2', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px' }}>
                    <span className="detail-label" style={{ color: '#991b1b' }}>❌ Rejection Reason</span>
                    <span className="detail-value">{selectedVolunteer.rejectionReason}</span>
                  </div>
                )}
              </div>

              {/* CURRENT ACTIVE TASK */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                  🚚 Current Active Assignment
                </h4>
                {!selectedVolunteer.currentAssignment ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No active task assigned currently.</p>
                ) : (
                  <div style={{ background: '#eff6ff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontWeight: 700, color: '#1d4ed8' }}>Delivery ID: {selectedVolunteer.currentAssignment.deliveryId}</div>
                    <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '0.25rem' }}>
                      📍 Pickup: <strong>{selectedVolunteer.currentAssignment.pickupLocation}</strong> ➔ Delivery: <strong>{selectedVolunteer.currentAssignment.deliveryLocation}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Recipient: {selectedVolunteer.currentAssignment.customerName} | Meals: {selectedVolunteer.currentAssignment.numberOfMeals}
                    </div>
                  </div>
                )}
              </div>

              {/* DELIVERY HISTORY TABLE */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                  📜 Complete Delivery Task History ({selectedVolunteer.deliveries?.length || 0})
                </h4>
                {!selectedVolunteer.deliveries || selectedVolunteer.deliveries.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No delivery history recorded for this volunteer yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedVolunteer.deliveries.map((del) => (
                      <div key={del.id} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>{del.deliveryId}</strong> - {del.customerName} ({del.numberOfMeals} meals)
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📍 Pickup: {del.pickupLocation} ➔ {del.deliveryLocation}</div>
                        </div>
                        <div>{getStatusBadge(del.status)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowVolDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN / REASSIGN VOLUNTEER TO DELIVERY MODAL */}
      {showAssignVolModal && selectedVolForAssignment && (
        <div className="modal-overlay" onClick={() => setShowAssignVolModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Task to {selectedVolForAssignment.name}</h3>
              <button className="close-btn" onClick={() => setShowAssignVolModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                Select an active delivery to assign (or reassign) to <strong>{selectedVolForAssignment.name}</strong> (
                {selectedVolForAssignment.vehicleType} - {selectedVolForAssignment.vehicleNumber}).
              </p>

              {activeOperations.length === 0 ? (
                <div className="empty-state">
                  <p>No active deliveries in the system available for assignment.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeOperations.map((op) => (
                    <div key={op.id} className="donation-select-card">
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{op.deliveryId}</strong> - {op.customerName}
                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                          🍱 {op.donorName} | 📦 {op.numberOfMeals} meals
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          📍 Pickup: {op.pickupLocation || 'Donor Locality'} ➔ Delivery: {op.deliveryLocation}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>
                          Currently Assigned: {op.volunteerName}
                        </div>
                      </div>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleConfirmAssignVolToDelivery(op.id)}
                      >
                        Assign {selectedVolForAssignment.name}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAssignVolModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW BENEFICIARY DETAILS MODAL */}
      {showBenDetailModal && selectedBeneficiary && (
        <div className="modal-overlay" onClick={() => setShowBenDetailModal(false)}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Beneficiary Organization Details - {selectedBeneficiary.beneficiaryId}</h3>
              <button className="close-btn" onClick={() => setShowBenDetailModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Organization Name</span>
                  <span className="detail-value">🏛️ {selectedBeneficiary.organizationName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Category</span>
                  <span className="detail-value">🏷️ {selectedBeneficiary.category}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Verification Status</span>
                  <span className="detail-value">{getVerificationBadge(selectedBeneficiary.verificationStatus)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Account Status</span>
                  <span className="detail-value">{getAccountBadge(selectedBeneficiary.accountStatus)}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Contact Person & Phone</span>
                  <span className="detail-value">👤 {selectedBeneficiary.contactPerson} (📞 {selectedBeneficiary.phone})</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">✉️ {selectedBeneficiary.email || 'N/A'}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Location / Address</span>
                  <span className="detail-value">📍 {selectedBeneficiary.location}, {selectedBeneficiary.city}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">People Served</span>
                  <span className="detail-value">👥 {selectedBeneficiary.peopleServed} residents / people</span>
                </div>

                {selectedBeneficiary.rejectionReason && (
                  <div className="detail-item" style={{ gridColumn: 'span 2', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px' }}>
                    <span className="detail-label" style={{ color: '#991b1b' }}>❌ Rejection Reason</span>
                    <span className="detail-value">{selectedBeneficiary.rejectionReason}</span>
                  </div>
                )}

                {selectedBeneficiary.notes && (
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">Admin Notes</span>
                    <span className="detail-value">{selectedBeneficiary.notes}</span>
                  </div>
                )}
              </div>

              {/* CURRENT OPEN FOOD REQUIREMENTS */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                  📋 Current Open Food Requirements ({selectedBeneficiary.foodRequests?.length || 0})
                </h4>
                {!selectedBeneficiary.foodRequests || selectedBeneficiary.foodRequests.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No open food requirements for this organization.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedBeneficiary.foodRequests.map((req) => (
                      <div key={req.id} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>{req.requestId}</strong> - {req.numberOfMeals} meals ({req.foodType})
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📍 {req.location} | Date: {req.requiredDate} {req.requiredTime}</div>
                        </div>
                        <div>{getStatusBadge(req.status)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PREVIOUS DONATION HISTORY */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                  🍱 Previous Donation & Fulfillment History ({selectedBeneficiary.donations?.length || 0})
                </h4>
                {!selectedBeneficiary.donations || selectedBeneficiary.donations.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No previous donations delivered to this beneficiary yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedBeneficiary.donations.map((don) => (
                      <div key={don.id} style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>{don.donationId}</strong> - {don.foodTitle} ({don.numberOfMeals} meals)
                          <div style={{ fontSize: '0.8rem', color: '#047857' }}>Donor: {don.donorName} | 📍 Pickup: {don.pickupLocation}</div>
                        </div>
                        <div>{getStatusBadge(don.status)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowBenDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT BENEFICIARY FORM MODAL */}
      {(showAddBenModal || showEditBenModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddBenModal(false); setShowEditBenModal(false); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showEditBenModal ? 'Edit Beneficiary Organization' : 'Add New Beneficiary Organization'}</h3>
              <button className="close-btn" onClick={() => { setShowAddBenModal(false); setShowEditBenModal(false); }}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitBenForm}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Organization Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={benFormData.organizationName}
                    onChange={(e) => setBenFormData({ ...benFormData, organizationName: e.target.value })}
                  />
                </div>

                <div className="detail-grid">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      className="form-control"
                      value={benFormData.category}
                      onChange={(e) => setBenFormData({ ...benFormData, category: e.target.value })}
                    >
                      <option value="Orphanage">Orphanage</option>
                      <option value="Children's Home">Children's Home</option>
                      <option value="Shelter">Shelter</option>
                      <option value="NGO">NGO</option>
                      <option value="Community Center">Community Center</option>
                      <option value="Old-Age Home">Old-Age Home</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>People Served *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      required
                      value={benFormData.peopleServed}
                      onChange={(e) => setBenFormData({ ...benFormData, peopleServed: e.target.value })}
                    />
                  </div>
                </div>

                <div className="detail-grid">
                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={benFormData.contactPerson}
                      onChange={(e) => setBenFormData({ ...benFormData, contactPerson: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={benFormData.phone}
                      onChange={(e) => setBenFormData({ ...benFormData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={benFormData.email}
                    onChange={(e) => setBenFormData({ ...benFormData, email: e.target.value })}
                  />
                </div>

                <div className="detail-grid">
                  <div className="form-group">
                    <label>Location / Street Address *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={benFormData.location}
                      onChange={(e) => setBenFormData({ ...benFormData, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      className="form-control"
                      value={benFormData.city}
                      onChange={(e) => setBenFormData({ ...benFormData, city: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Admin Notes</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={benFormData.notes}
                    onChange={(e) => setBenFormData({ ...benFormData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setShowAddBenModal(false); setShowEditBenModal(false); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {showEditBenModal ? 'Save Changes' : 'Create Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW VEHICLE DETAILS & USAGE HISTORY MODAL */}
      {showVehDetailModal && selectedVehicle && (
        <div className="modal-overlay" onClick={() => setShowVehDetailModal(false)}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Vehicle Details & Usage History - {selectedVehicle.vehicleNumber}</h3>
              <button className="close-btn" onClick={() => setShowVehDetailModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Vehicle Registration</span>
                  <span className="detail-value">🚗 {selectedVehicle.vehicleNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Vehicle ID</span>
                  <span className="detail-value">🆔 {selectedVehicle.vehicleId}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Vehicle Type</span>
                  <span className="detail-value">🏷️ {selectedVehicle.vehicleType}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Meal Capacity</span>
                  <span className="detail-value">📦 {selectedVehicle.capacity} meals</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Operational Status</span>
                  <span className="detail-value">{getVehicleStatusBadge(selectedVehicle.status)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Account Status</span>
                  <span className="detail-value">{getAccountBadge(selectedVehicle.accountStatus)}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Assigned Volunteer / Driver</span>
                  <span className="detail-value">🙋‍♂️ {selectedVehicle.assignedVolunteerName || 'Unassigned'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">City</span>
                  <span className="detail-value">📍 {selectedVehicle.city || 'Hyderabad'}</span>
                </div>

                {selectedVehicle.notes && (
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">Admin Notes</span>
                    <span className="detail-value">{selectedVehicle.notes}</span>
                  </div>
                )}
              </div>

              {/* CURRENT ACTIVE DELIVERY */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                  🚚 Current Active Assignment
                </h4>
                {!selectedVehicle.currentDeliveryDetails ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No active delivery assigned to this vehicle currently.</p>
                ) : (
                  <div style={{ background: '#eff6ff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontWeight: 700, color: '#1d4ed8' }}>
                      Delivery ID: {selectedVehicle.currentDeliveryDetails.deliveryId} ({selectedVehicle.currentDeliveryDetails.numberOfMeals} meals)
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '0.25rem' }}>
                      📍 Pickup: <strong>{selectedVehicle.currentDeliveryDetails.pickupLocation}</strong> ➔ Delivery: <strong>{selectedVehicle.currentDeliveryDetails.deliveryLocation}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* VEHICLE USAGE HISTORY TABLE */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                  📜 Vehicle Delivery Usage History ({selectedVehicle.usageHistory?.length || 0})
                </h4>
                {!selectedVehicle.usageHistory || selectedVehicle.usageHistory.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No delivery usage history recorded for this vehicle yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedVehicle.usageHistory.map((del) => (
                      <div key={del.id} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>{del.deliveryId}</strong> - {del.customerName} ({del.numberOfMeals} meals)
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📍 Pickup: {del.pickupLocation} ➔ {del.deliveryLocation}</div>
                        </div>
                        <div>{getStatusBadge(del.status)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowVehDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT VEHICLE FORM MODAL */}
      {(showAddVehModal || showEditVehModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddVehModal(false); setShowEditVehModal(false); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showEditVehModal ? 'Edit Transport Vehicle' : 'Add New Transport Vehicle'}</h3>
              <button className="close-btn" onClick={() => { setShowAddVehModal(false); setShowEditVehModal(false); }}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitVehForm}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Vehicle Registration Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. TS 09 EQ 4521"
                    value={vehFormData.vehicleNumber}
                    onChange={(e) => setVehFormData({ ...vehFormData, vehicleNumber: e.target.value })}
                  />
                </div>

                <div className="detail-grid">
                  <div className="form-group">
                    <label>Vehicle Type *</label>
                    <select
                      className="form-control"
                      value={vehFormData.vehicleType}
                      onChange={(e) => setVehFormData({ ...vehFormData, vehicleType: e.target.value })}
                    >
                      <option value="Two Wheeler">Two Wheeler</option>
                      <option value="Three Wheeler">Three Wheeler</option>
                      <option value="Four Wheeler">Four Wheeler</option>
                      <option value="Mini Truck">Mini Truck</option>
                      <option value="Van">Van</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Meal Capacity *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      required
                      placeholder="e.g. 150"
                      value={vehFormData.capacity}
                      onChange={(e) => setVehFormData({ ...vehFormData, capacity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>City / Operating Zone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={vehFormData.city}
                    onChange={(e) => setVehFormData({ ...vehFormData, city: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Admin Notes</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={vehFormData.notes}
                    onChange={(e) => setVehFormData({ ...vehFormData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setShowAddVehModal(false); setShowEditVehModal(false); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {showEditVehModal ? 'Save Changes' : 'Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN VEHICLE TO DELIVERY MODAL (WITH MEAL CAPACITY VALIDATION CHECK) */}
      {showAssignVehModal && selectedVehForAssignment && (
        <div className="modal-overlay" onClick={() => setShowAssignVehModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Vehicle {selectedVehForAssignment.vehicleNumber}</h3>
              <button className="close-btn" onClick={() => setShowAssignVehModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                Assign vehicle <strong>{selectedVehForAssignment.vehicleNumber}</strong> ({selectedVehForAssignment.vehicleType}) with meal capacity of{' '}
                <strong style={{ color: '#059669' }}>📦 {selectedVehForAssignment.capacity} meals</strong>.
              </p>

              {activeOperations.length === 0 ? (
                <div className="empty-state">
                  <p>No active deliveries in the system available for vehicle assignment.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeOperations.map((op) => {
                    const isSufficientCapacity = op.numberOfMeals <= selectedVehForAssignment.capacity;
                    return (
                      <div
                        key={op.id}
                        className="donation-select-card"
                        style={{
                          borderColor: isSufficientCapacity ? '#cbd5e1' : '#fca5a5',
                          background: isSufficientCapacity ? '#ffffff' : '#fef2f2',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{op.deliveryId}</strong> - {op.customerName}
                          <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                            🍱 {op.donorName} | <strong>📦 {op.numberOfMeals} meals</strong>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            📍 Pickup: {op.pickupLocation || 'Donor Locality'} ➔ Delivery: {op.deliveryLocation}
                          </div>

                          {!isSufficientCapacity ? (
                            <div style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.25rem' }}>
                              ⚠️ Insufficient Capacity ({op.numberOfMeals} meals required &gt; {selectedVehForAssignment.capacity} capacity)
                            </div>
                          ) : (
                            <div style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.25rem' }}>
                              ✅ Sufficient Capacity ({op.numberOfMeals} meals &le; {selectedVehForAssignment.capacity} capacity)
                            </div>
                          )}
                        </div>

                        <button
                          className={`btn ${isSufficientCapacity ? 'btn-success' : 'btn-secondary'} btn-sm`}
                          disabled={!isSufficientCapacity}
                          onClick={() => handleConfirmAssignVehToDelivery(op.id)}
                        >
                          {isSufficientCapacity ? 'Assign Vehicle' : 'Capacity Exceeded'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAssignVehModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Customer Food Requirement</h3>
              <button className="close-btn" onClick={() => setShowNewModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateNewRequest}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={newRequestData.customerName}
                    onChange={(e) => setNewRequestData({ ...newRequestData, customerName: e.target.value })}
                  />
                </div>

                <div className="detail-grid">
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={newRequestData.phone}
                      onChange={(e) => setNewRequestData({ ...newRequestData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Meals *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      required
                      value={newRequestData.numberOfMeals}
                      onChange={(e) => setNewRequestData({ ...newRequestData, numberOfMeals: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={newRequestData.location}
                    onChange={(e) => setNewRequestData({ ...newRequestData, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowNewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Submit Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: ASSIGN VOLUNTEER & VEHICLE (RESOURCE ALLOCATION WITH CAPACITY CHECK) */}
      {showAssignResourcesModal && selectedPendingDelivery && (
        <div className="modal-overlay" onClick={() => setShowAssignResourcesModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>🚚 Assign Volunteer & Transport Vehicle</h3>
              <button className="close-btn" onClick={() => setShowAssignResourcesModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {/* Delivery Request Summary Card */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <strong style={{ color: '#2563eb' }}>ID: {selectedPendingDelivery.deliveryId}</strong>
                  <span className="meals-pill">🍱 Required: {selectedPendingDelivery.numberOfMeals} meals</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  <div>🚩 <strong>Pickup:</strong> {selectedPendingDelivery.donorName} ({selectedPendingDelivery.pickupLocation})</div>
                  <div>🏁 <strong>Delivery:</strong> {selectedPendingDelivery.customerName} ({selectedPendingDelivery.deliveryLocation})</div>
                </div>
              </div>

              {/* SELECT VOLUNTEER */}
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label style={{ fontWeight: 600 }}>1. Select Available Verified Volunteer *</label>
                {availableVolunteersList.length === 0 ? (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '6px' }}>
                    ⚠️ No verified volunteers currently available (all offline or assigned).
                  </div>
                ) : (
                  <select
                    className="form-control"
                    value={selectedVolunteerId}
                    onChange={(e) => setSelectedVolunteerId(e.target.value)}
                  >
                    {availableVolunteersList.map((vol) => (
                      <option key={vol.id} value={vol.id}>
                        🙋‍♂️ {vol.name} ({vol.phone}) — {vol.vehicleType || 'Volunteer'} [{vol.availabilityStatus}]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* SELECT VEHICLE */}
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>2. Select Available Transport Vehicle *</label>
                {availableVehiclesList.length === 0 ? (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', background: '#fef2f2', padding: '0.5rem', borderRadius: '6px' }}>
                    ⚠️ No available vehicles with sufficient capacity ({selectedPendingDelivery.numberOfMeals} meals).
                  </div>
                ) : (
                  <select
                    className="form-control"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                  >
                    {availableVehiclesList.map((veh) => {
                      const isCapOk = veh.capacity >= selectedPendingDelivery.numberOfMeals;
                      return (
                        <option key={veh.id} value={veh.id}>
                          🚗 {veh.vehicleNumber} ({veh.vehicleType}) — Capacity: {veh.capacity} meals {isCapOk ? '✅' : '⚠️ Insufficient'}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* CAPACITY CHECK STATUS INDICATOR */}
              {selectedVehicleId && (() => {
                const selVeh = availableVehiclesList.find((v) => v.id === selectedVehicleId);
                if (!selVeh) return null;
                const isSuff = selVeh.capacity >= selectedPendingDelivery.numberOfMeals;
                return (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      background: isSuff ? '#ecfdf5' : '#fef2f2',
                      border: `1px solid ${isSuff ? '#a7f3d0' : '#fecaca'}`,
                      color: isSuff ? '#065f46' : '#991b1b',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                    }}
                  >
                    {isSuff ? (
                      <div>✅ Sufficient Capacity ({selectedPendingDelivery.numberOfMeals} meals required &le; {selVeh.capacity} vehicle capacity)</div>
                    ) : (
                      <div>⚠️ Insufficient Capacity ({selectedPendingDelivery.numberOfMeals} meals required &gt; {selVeh.capacity} vehicle capacity)</div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAssignResourcesModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={!selectedVolunteerId || !selectedVehicleId}
                onClick={handleConfirmAssignResources}
              >
                Confirm Volunteer & Vehicle Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DELIVERY LIFECYCLE DETAILS & TIMELINE STEPPER */}
      {showDeliveryDetailModal && selectedDelivery && (
        <div className="modal-overlay" onClick={() => setShowDeliveryDetailModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>📦 Delivery Lifecycle Details — {selectedDelivery.deliveryId}</h3>
              <button className="close-btn" onClick={() => setShowDeliveryDetailModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {/* LIFECYCLE STEPPER PROGRESS BAR */}
              <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: '#475569' }}>Operational Lifecycle Status Flow</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.2rem', flexWrap: 'wrap' }}>
                  {[
                    'PENDING_ASSIGNMENT',
                    'ASSIGNED',
                    'ACCEPTED',
                    'GOING_TO_PICKUP',
                    'FOOD_COLLECTED',
                    'OUT_FOR_DELIVERY',
                    'DELIVERED',
                    'ACKNOWLEDGED',
                    'COMPLETED',
                  ].map((st, idx) => {
                    const statusOrder = [
                      'PENDING_ASSIGNMENT',
                      'ASSIGNED',
                      'ACCEPTED',
                      'GOING_TO_PICKUP',
                      'FOOD_COLLECTED',
                      'OUT_FOR_DELIVERY',
                      'DELIVERED',
                      'ACKNOWLEDGED',
                      'COMPLETED',
                    ];
                    const activeIdx = statusOrder.indexOf(selectedDelivery.status);
                    const isPassed = idx <= activeIdx;
                    const isCurrent = idx === activeIdx;

                    return (
                      <div
                        key={st}
                        style={{
                          flex: 1,
                          minWidth: '70px',
                          textAlign: 'center',
                          padding: '0.4rem 0.2rem',
                          borderRadius: '4px',
                          background: isCurrent ? '#2563eb' : isPassed ? '#10b981' : '#e2e8f0',
                          color: isPassed || isCurrent ? '#ffffff' : '#64748b',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                        }}
                      >
                        {st.replace(/_/g, ' ')}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>📍 Route & Food Info</h4>
                  <p><strong>Donor:</strong> {selectedDelivery.donorName}</p>
                  <p><strong>Pickup Location:</strong> {selectedDelivery.pickupLocation || 'N/A'}</p>
                  <p><strong>Recipient:</strong> {selectedDelivery.customerName}</p>
                  <p><strong>Delivery Location:</strong> {selectedDelivery.deliveryLocation || 'N/A'}</p>
                  <p><strong>Quantity:</strong> {selectedDelivery.numberOfMeals} meals</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>🚚 Assigned Resources & Status</h4>
                  <p><strong>Method:</strong> {selectedDelivery.deliveryMethod}</p>
                  <p><strong>Volunteer:</strong> {selectedDelivery.volunteerName} ({selectedDelivery.volunteerPhone || 'N/A'})</p>
                  <p><strong>Vehicle:</strong> {selectedDelivery.vehicleNumber || 'Unassigned'}</p>
                  <p><strong>Status:</strong> {getDeliveryStatusBadge(selectedDelivery.status, selectedDelivery.isDelayed)}</p>
                  <p><strong>Stage:</strong> {selectedDelivery.currentStage}</p>
                </div>
              </div>

              {/* LIFECYCLE LOG HISTORY */}
              {selectedDelivery.lifecycleLogs && selectedDelivery.lifecycleLogs.length > 0 && (
                <div style={{ marginTop: '1.2rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>📜 Audit & Lifecycle History</h4>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    {selectedDelivery.lifecycleLogs.map((log, lIdx) => (
                      <div key={lIdx} style={{ fontSize: '0.8rem', padding: '0.25rem 0', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 600, color: '#2563eb' }}>[{log.status}]</span>{' '}
                        <span>{log.note}</span>{' '}
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          — {log.updatedBy} ({formatDate(log.timestamp)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDeliveryDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADVANCE DELIVERY LIFECYCLE STAGE */}
      {showStatusProgressionModal && selectedDelivery && (
        <div className="modal-overlay" onClick={() => setShowStatusProgressionModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>🔄 Advance Delivery Stage — {selectedDelivery.deliveryId}</h3>
              <button className="close-btn" onClick={() => setShowStatusProgressionModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: '#475569' }}>
                Current Status: <strong>{selectedDelivery.status}</strong> ({selectedDelivery.currentStage})
              </p>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label style={{ fontWeight: 600 }}>Target Lifecycle Stage *</label>
                <select
                  className="form-control"
                  value={nextStatusSelection}
                  onChange={(e) => setNextStatusSelection(e.target.value)}
                >
                  <option value="ACCEPTED">ACCEPTED (Volunteer Accepts)</option>
                  <option value="GOING_TO_PICKUP">GOING_TO_PICKUP (En route to Donor)</option>
                  <option value="FOOD_COLLECTED">FOOD_COLLECTED (Picked up from Donor)</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (En route to Recipient)</option>
                  <option value="DELIVERED">DELIVERED (Arrived & Handed Over)</option>
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED (Recipient Acknowledged)</option>
                  <option value="COMPLETED">COMPLETED (Finalized & Release Resources)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Lifecycle Note / Log Message</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Reason / Progress notes..."
                  value={statusNoteSelection}
                  onChange={(e) => setStatusNoteSelection(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowStatusProgressionModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleConfirmUpdateStatus}>
                Update Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOTIFICATIONS CENTER */}
      {showNotifModal && (
        <div className="modal-overlay" onClick={() => setShowNotifModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>🔔 Admin Notifications Center</h3>
              <button className="close-btn" onClick={() => setShowNotifModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                  Unread Alerts: <strong>{unreadNotifCount}</strong>
                </span>
                <button className="btn btn-outline btn-xs" onClick={handleMarkAllNotifsRead}>
                  ✓ Mark All as Read
                </button>
              </div>

              {notificationsList.length === 0 ? (
                <div className="empty-state">
                  <p>No notifications available.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '350px', overflowY: 'auto' }}>
                  {notificationsList.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '6px',
                        background: n.isRead ? '#f8fafc' : '#f0fdf4',
                        border: `1px solid ${n.isRead ? '#e2e8f0' : '#bbf7d0'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span className="badge badge-submitted">{n.type}</span>
                          <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{n.title}</strong>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: '0.2rem' }}>{n.message}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          ID: {n.relatedEntityId || 'System'} | {formatDate(n.createdAt)}
                        </div>
                      </div>
                      {!n.isRead && (
                        <button className="btn btn-success btn-xs" onClick={() => handleMarkNotifRead(n.id)}>
                          ✓ Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNotifModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: USER PROFILE & HISTORY */}
      {showUserDetailModal && selectedUserProfile && (
        <div className="modal-overlay" onClick={() => setShowUserDetailModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>👤 User Profile & History — {selectedUserProfile.user?.name || selectedUserProfile.name}</h3>
              <button className="close-btn" onClick={() => setShowUserDetailModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {(() => {
                const u = selectedUserProfile.user || selectedUserProfile;
                const reqs = selectedUserProfile.requests || [];
                const dons = selectedUserProfile.donations || [];
                const dels = selectedUserProfile.deliveries || [];

                return (
                  <div>
                    <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <p><strong>Name:</strong> {u.name}</p>
                        <p><strong>Email:</strong> {u.email}</p>
                        <p><strong>Phone:</strong> {u.phone || 'N/A'}</p>
                        <p><strong>City:</strong> {u.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p><strong>Role:</strong> <span className="badge badge-verified">{u.role}</span></p>
                        <p><strong>Account Status:</strong> {getAccountBadge(u.accountStatus)}</p>
                        <p><strong>Verification:</strong> {getVerificationBadge(u.verificationStatus || 'VERIFIED')}</p>
                        <p><strong>Joined Date:</strong> {formatDate(u.createdAt)}</p>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <h4 style={{ fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                        📜 User Activity Log Summary
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                        Food Requirements Created: <strong>{reqs.length}</strong> | Donations Submitted: <strong>{dons.length}</strong> | Deliveries: <strong>{dels.length}</strong>
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowUserDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER ROLE */}
      {showEditRoleModal && selectedUserProfile && (
        <div className="modal-overlay" onClick={() => setShowEditRoleModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>✏️ Manage Role Permissions — {selectedUserProfile.name}</h3>
              <button className="close-btn" onClick={() => setShowEditRoleModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: '#475569' }}>
                Current Role: <strong>{selectedUserProfile.role}</strong> ({selectedUserProfile.email})
              </p>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label style={{ fontWeight: 600 }}>Select New Role *</label>
                <select
                  className="form-control"
                  value={selectedUserRole}
                  onChange={(e) => setSelectedUserRole(e.target.value)}
                >
                  <option value="CUSTOMER">CUSTOMER (Can request food)</option>
                  <option value="DONOR">DONOR (Can donate food)</option>
                  <option value="VOLUNTEER">VOLUNTEER (Can deliver food)</option>
                  <option value="ADMIN">ADMIN (Full System Controls)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEditRoleModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleConfirmUpdateRole}>
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INVESTIGATE & RESOLVE ISSUE REPORT */}
      {showReportDetailModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowReportDetailModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>⚠️ Report Resolution — {selectedReport.reportId}</h3>
              <button className="close-btn" onClick={() => setShowReportDetailModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <strong>Reporter: {selectedReport.reporterName} ({selectedReport.reporterRole})</strong>
                  <span className="badge badge-submitted">{selectedReport.issueType}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>{selectedReport.description}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.3rem' }}>
                  Related ID: {selectedReport.relatedEntityId || 'N/A'} | Date: {formatDate(selectedReport.createdAt)}
                </div>
              </div>

              <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Report Status *</label>
                  <select
                    className="form-control"
                    value={reportStatusInput}
                    onChange={(e) => setReportStatusInput(e.target.value)}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Priority Level *</label>
                  <select
                    className="form-control"
                    value={reportPriorityInput}
                    onChange={(e) => setReportPriorityInput(e.target.value)}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Resolution Notes / Corrective Actions *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Document resolution steps, contact outcomes, or corrective measures taken..."
                  value={resolutionNotesInput}
                  onChange={(e) => setResolutionNotesInput(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReportDetailModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleConfirmUpdateReportStatus}>
                Save Resolution Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXECUTE PARTIAL FULFILLMENT */}
      {showPartialFulfillModal && partialTargetDonation && partialTargetRequest && (
        <div className="modal-overlay" onClick={() => setShowPartialFulfillModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>⚖️ Execute Partial Fulfillment Match</h3>
              <button className="close-btn" onClick={() => setShowPartialFulfillModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#ecfdf5', padding: '0.85rem', borderRadius: '6px', border: '1px solid #a7f3d0', marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#065f46' }}>
                  Matching donation <strong>{partialTargetDonation.donationId}</strong> ({partialTargetDonation.numberOfMeals} meals available) to request <strong>{partialTargetRequest.requestId}</strong> ({partialTargetRequest.numberOfMeals} meals required).
                </p>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Fulfilled Quantity (Meals to Allocate) *</label>
                <input
                  type="number"
                  min="1"
                  max={Math.min(partialTargetRequest.numberOfMeals, partialTargetDonation.numberOfMeals)}
                  className="form-control"
                  value={partialFulFillInputQty}
                  onChange={(e) => setPartialFulFillInputQty(Number(e.target.value))}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div>Fulfilled Meals for Delivery: <strong>{partialFulFillInputQty} meals</strong></div>
                <div style={{ color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>
                  Remaining Unfulfilled Requirement: <strong>{Math.max(0, partialTargetRequest.numberOfMeals - partialFulFillInputQty)} meals</strong> (Stays Open)
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Notes / Operational Log</label>
                <input
                  type="text"
                  className="form-control"
                  value={partialNotes}
                  onChange={(e) => setPartialNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPartialFulfillModal(false)}>
                Cancel
              </button>
              <button className="btn btn-success btn-sm" onClick={handleConfirmPartialFulfillment}>
                Confirm Partial Fulfillment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
