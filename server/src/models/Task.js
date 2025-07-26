import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['assignment', 'project', 'quiz', 'presentation'],
    required: true
  },
  maxScore: {
    type: Number,
    required: true,
    min: 0
  },
  deadline: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  instructions: {
    type: String
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual to check if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return new Date() > this.deadline;
});

// Static method to get active tasks
taskSchema.statics.getActiveTasks = function() {
  return this.find({ isActive: true }).sort({ deadline: 1 });
};

export default mongoose.model('Task', taskSchema); 