const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  whatsappGroupId: { type: String, trim: true },
  whatsappGroupName: { type: String, trim: true },
  color: { type: String, default: '#3B82F6' },
  icon: { type: String, default: '🎨' },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

departmentSchema.virtual('employeeCount').get(function () {
  return this.employees.length;
});

module.exports = mongoose.model('Department', departmentSchema);
