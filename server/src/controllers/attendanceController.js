import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

// Mark attendance (Participants)
export const markAttendance = async (req, res) => {
  try {
    const { date, session, status = 'present', remarks } = req.body;

    // Check if attendance already exists for this date and session
    const existingAttendance = await Attendance.findOne({
      userId: req.user._id,
      date: new Date(date),
      session
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this session'
      });
    }

    const attendance = new Attendance({
      userId: req.user._id,
      date: new Date(date),
      session,
      status,
      remarks
    });

    await attendance.save();
    await attendance.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: { attendance }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

// Get user's attendance history (Participants)
export const getUserAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      session,
      status
    } = req.query;

    // Build query
    const query = { userId: req.user._id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (session) query.session = session;
    if (status) query.status = status;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .sort({ date: -1, session: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get attendance statistics
    const stats = await Attendance.getAttendanceStats(
      req.user._id,
      startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date()
    );

    res.json({
      success: true,
      data: {
        attendance: attendanceRecords,
        stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};

// Get all attendance records (Admin only)
export const getAllAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      session,
      status,
      userId,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (session) query.session = session;
    if (status) query.status = status;
    if (userId) query.userId = userId;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate('userId', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        attendance: attendanceRecords,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
};

// Update attendance record (Admin only)
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      { status, remarks },
      { new: true }
    ).populate('userId', 'name email');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: { attendance }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance',
      error: error.message
    });
  }
};

// Delete attendance record (Admin only)
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findByIdAndDelete(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record',
      error: error.message
    });
  }
};

// Get attendance statistics (Admin only)
export const getAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    // Default to last 30 days if no date range provided
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = new Date();

    const dateQuery = {
      date: {
        $gte: startDate ? new Date(startDate) : defaultStartDate,
        $lte: endDate ? new Date(endDate) : defaultEndDate
      }
    };

    if (userId) {
      dateQuery.userId = userId;
    }

    // Overall attendance statistics
    const overallStats = await Attendance.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily attendance trends
    const dailyTrends = await Attendance.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          attendance: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // User-wise attendance summary (if not filtered by specific user)
    let userSummary = [];
    if (!userId) {
      userSummary = await Attendance.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: {
              userId: '$userId',
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.userId',
            attendance: {
              $push: {
                status: '$_id.status',
                count: '$count'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $project: {
            user: { $arrayElemAt: ['$user', 0] },
            attendance: 1
          }
        }
      ]);
    }

    const statsBreakdown = overallStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, { present: 0, absent: 0, late: 0 });

    res.json({
      success: true,
      data: {
        overall: statsBreakdown,
        dailyTrends,
        userSummary: userSummary.slice(0, 20) // Limit to top 20 users
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics',
      error: error.message
    });
  }
};

// Get today's attendance
export const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    })
      .populate('userId', 'name email')
      .sort({ session: 1, markedAt: -1 });

    // Get statistics for today
    const todayStats = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsBreakdown = todayStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, { present: 0, absent: 0, late: 0 });

    res.json({
      success: true,
      data: {
        attendance: todayAttendance,
        stats: statsBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s attendance',
      error: error.message
    });
  }
};

// Check if user can mark attendance (Participants)
export const canMarkAttendance = async (req, res) => {
  try {
    const { date, session } = req.query;

    if (!date || !session) {
      return res.status(400).json({
        success: false,
        message: 'Date and session are required'
      });
    }

    const existingAttendance = await Attendance.findOne({
      userId: req.user._id,
      date: new Date(date),
      session
    });

    res.json({
      success: true,
      data: {
        canMark: !existingAttendance,
        alreadyMarked: !!existingAttendance,
        existingRecord: existingAttendance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check attendance status',
      error: error.message
    });
  }
}; 