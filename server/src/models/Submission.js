import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  submissionType: {
    type: String,
    enum: ['file', 'link', 'text'],
    required: true
  },
  content: {
    // For text submissions
    text: String,
    // For file submissions
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    // For link submissions
    link: String,
    linkTitle: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    min: 0,
    default: null
  },
  feedback: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  isLate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate submissions
submissionSchema.index({ userId: 1, taskId: 1 }, { unique: true });

// Method to calculate if submission was late
submissionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Task = mongoose.model('Task');
    const task = await Task.findById(this.taskId);
    if (task && this.submittedAt > task.deadline) {
      this.isLate = true;
    }
  }
  next();
});

// Static method to get user submissions
submissionSchema.statics.getUserSubmissions = function(userId) {
  return this.find({ userId })
    .populate('taskId', 'title type maxScore deadline')
    .sort({ submittedAt: -1 });
};

export default mongoose.model('Submission', submissionSchema); 