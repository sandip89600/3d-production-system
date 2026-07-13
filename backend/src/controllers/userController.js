const User = require('../models/User');
const Department = require('../models/Department');
const { logActivity } = require('../middleware/auth');

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const { role, department, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('department', 'name code')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department', 'name code color')
      .populate('createdBy', 'name email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, adminCode, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

    if (role === 'admin' && adminCode) {
      const existingCode = await User.findOne({ adminCode: adminCode.toUpperCase() });
      if (existingCode) return res.status(400).json({ success: false, message: 'Admin code already in use' });
    }

    const user = await User.create({
      name, email, password, role,
      adminCode: role === 'admin' ? adminCode?.toUpperCase() : undefined,
      department,
      createdBy: req.user._id,
    });

    // Add employee to department if specified
    if (department && role === 'employee') {
      await Department.findByIdAndUpdate(department, { $addToSet: { employees: user._id } });
    }

    await logActivity(req, 'user_create', `${role}: ${name}`, { userId: user._id });
    res.status(201).json({ success: true, message: 'User created', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { name, email, role, adminCode, department, isActive } = req.body;
    
    // Get the current user first to see if details are changing
    const currentUser = await User.findById(req.params.id);
    if (!currentUser) return res.status(404).json({ success: false, message: 'User not found' });

    // Check duplicate email
    if (email && email.toLowerCase() !== currentUser.email.toLowerCase()) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    // Check duplicate adminCode for admins
    const targetRole = role || currentUser.role;
    if (targetRole === 'admin' && adminCode && adminCode.toUpperCase() !== currentUser.adminCode) {
      const existingCode = await User.findOne({ adminCode: adminCode.toUpperCase() });
      if (existingCode) return res.status(400).json({ success: false, message: 'Admin code already in use' });
    }

    // Handle department switching for employees
    if (department !== undefined && String(department || '') !== String(currentUser.department || '')) {
      // Remove from old department
      if (currentUser.department) {
        await Department.findByIdAndUpdate(currentUser.department, { $pull: { employees: currentUser._id } });
      }
      // Add to new department (only if employee role)
      if (department && targetRole === 'employee') {
        await Department.findByIdAndUpdate(department, { $addToSet: { employees: currentUser._id } });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email: email ? email.toLowerCase() : undefined,
        role,
        adminCode: targetRole === 'admin' ? adminCode?.toUpperCase() : undefined,
        department: department || null,
        isActive
      },
      { new: true, runValidators: true }
    ).populate('department', 'name code');

    await logActivity(req, 'user_update', `User: ${user.name}`, { userId: user._id });
    res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Clean up department reference
    if (user.department) {
      await Department.findByIdAndUpdate(user.department, {
        $pull: { employees: user._id }
      });
    }

    // Unassign projects
    const Project = require('../models/Project');
    await Project.updateMany(
      { assignedTo: user._id },
      { $set: { assignedTo: null, status: 'available', progress: 0 } }
    );

    await User.findByIdAndDelete(req.params.id);
    await logActivity(req, 'user_delete', `Deleted ${user.role}: ${user.name} (${user.email})`);

    res.json({ success: true, message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} permanently deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/employees
const getEmployees = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = { role: 'employee', isActive: true };
    if (department) filter.department = department;

    const employees = await User.find(filter)
      .populate('department', 'name code color')
      .sort({ name: 1 });

    res.json({ success: true, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/admins
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true })
      .populate('department', 'name code')
      .sort({ name: 1 });
    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, getEmployees, getAdmins };
