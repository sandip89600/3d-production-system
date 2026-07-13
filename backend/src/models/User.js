const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, alias: 'fullName' },
  companyName: { type: String, trim: true, default: '' },
  totalProjects: { type: Number, default: 0 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'employee', 'client'],
    required: true,
  },
  adminCode: {
    type: String,
    uppercase: true,
    trim: true,
    sparse: true,
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  avatar: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: null },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  lastLogin: { type: Date, default: null },
  lastLoginIP: { type: String, default: null },
  refreshTokens: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  mobile: { type: String, trim: true, sparse: true, index: true },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  otpAttempts: { type: Number, default: 0 },
  profilePhoto: { type: String, default: null },
  skills: [{ type: String }],
  experience: { type: Number, default: 0 },
  address: { type: String, default: '' },
  emergencyContact: {
    name: { type: String, default: '' },
    relation: { type: String, default: '' },
    mobile: { type: String, default: '' },
  },
  joiningDate: { type: Date, default: Date.now },
  accountStatus: { type: String, enum: ['active', 'deactivated', 'suspended'], default: 'active' },
  notificationSettings: {
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    system: { type: Boolean, default: true },
    deadlineAlerts: { type: Boolean, default: true },
  },
  privacySettings: {
    profileVisibility: { type: String, enum: ['public', 'team', 'private'], default: 'team' },
    contactVisibility: { type: String, enum: ['public', 'team', 'private'], default: 'team' },
    activityVisibility: { type: String, enum: ['public', 'team', 'private'], default: 'team' },
  },
  employeeId: { type: String, unique: true, uppercase: true, trim: true, sparse: true },
  username: { type: String, unique: true, lowercase: true, trim: true, sparse: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  designation: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  lastPasswordChange: { type: Date, default: null },
  emailVerified: { type: Boolean, default: false },
  mobileVerified: { type: Boolean, default: false },
  language: { type: String, default: 'en' },
  timezone: { type: String, default: 'UTC' },
  darkMode: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      delete ret.twoFactorSecret;
      delete ret.refreshTokens;
      return ret;
    },
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Increment login attempts
userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    await this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
    return;
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }; // 15 min lock
  }
  await this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function () {
  await this.updateOne({ $set: { loginAttempts: 0, lastLogin: new Date() }, $unset: { lockUntil: 1 } });
};

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

module.exports = mongoose.model('User', userSchema);
