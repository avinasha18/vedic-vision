import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// Auth validation rules
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('role')
    .optional()
    .isIn(['participant', 'admin'])
    .withMessage('Role must be either participant or admin')
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Task validation rules
export const validateCreateTask = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('type')
    .isIn(['assignment', 'project', 'quiz', 'presentation'])
    .withMessage('Invalid task type'),
  body('maxScore')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max score must be between 1 and 1000'),
  body('deadline')
    .isISO8601()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    })
];

// Submission validation rules
export const validateSubmission = [
  body('taskId')
    .isMongoId()
    .withMessage('Invalid task ID'),
  body('submissionType')
    .isIn(['file', 'link', 'text'])
    .withMessage('Invalid submission type'),
  body('content.text')
    .if(body('submissionType').equals('text'))
    .notEmpty()
    .withMessage('Text content is required for text submissions'),
  body('content.link')
    .if(body('submissionType').equals('link'))
    .isURL()
    .withMessage('Valid URL is required for link submissions'),
  body('content.linkTitle')
    .if(body('submissionType').equals('link'))
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Link title must not exceed 100 characters')
];

// Attendance validation rules
export const validateAttendance = [
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('session')
    .isIn(['morning', 'afternoon', 'evening', 'full-day'])
    .withMessage('Invalid session type'),
  body('status')
    .optional()
    .isIn(['present', 'absent', 'late'])
    .withMessage('Invalid attendance status')
];

// Announcement validation rules
export const validateAnnouncement = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('targetAudience')
    .optional()
    .isIn(['all', 'participants', 'admins'])
    .withMessage('Invalid target audience'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    })
];

// Grading validation rules
export const validateGrading = [
  body('score')
    .isInt({ min: 0 })
    .withMessage('Score must be a non-negative integer'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Feedback must not exceed 500 characters')
];

// MongoDB ID validation
export const validateMongoId = (field = 'id') => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field}`)
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isString()
    .withMessage('SortBy must be a string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be either asc or desc')
]; 