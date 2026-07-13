const Department = require('../models/Department');
const User = require('../models/User');
const { logActivity } = require('../middleware/auth');

// GET /api/departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('admin', 'name email adminCode')
      .populate('employees', 'name email')
      .sort({ name: 1 });
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/departments/:id
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('admin', 'name email adminCode avatar')
      .populate('employees', 'name email avatar lastLogin');
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/departments
const createDepartment = async (req, res) => {
  try {
    const { name, code, description, admin, whatsappGroupId, whatsappGroupName, color, icon } = req.body;

    const existing = await Department.findOne({ $or: [{ name }, { code: code?.toUpperCase() }] });
    if (existing) return res.status(400).json({ success: false, message: 'Department name or code already exists' });

    const department = await Department.create({
      name, description,
      code: code?.toUpperCase(),
      admin, whatsappGroupId, whatsappGroupName, color, icon,
    });

    // Update admin's department reference
    if (admin) {
      await User.findByIdAndUpdate(admin, { department: department._id });
    }

    await logActivity(req, 'department_create', `Department: ${name}`, { departmentId: department._id });
    res.status(201).json({ success: true, message: 'Department created', department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/departments/:id
const updateDepartment = async (req, res) => {
  try {
    const { name, description, admin, whatsappGroupId, whatsappGroupName, color, icon, isActive } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, admin, whatsappGroupId, whatsappGroupName, color, icon, isActive },
      { new: true }
    ).populate('admin', 'name email adminCode');

    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    await logActivity(req, 'department_update', `Department: ${department.name}`);
    res.json({ success: true, message: 'Department updated', department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/departments/:id/employees
const addEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { employees: employeeId } },
      { new: true }
    );
    await User.findByIdAndUpdate(employeeId, { department: req.params.id });
    res.json({ success: true, message: 'Employee added to department', department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/departments/:id/employees/:employeeId
const removeEmployee = async (req, res) => {
  try {
    await Department.findByIdAndUpdate(
      req.params.id,
      { $pull: { employees: req.params.employeeId } }
    );
    await User.findByIdAndUpdate(req.params.employeeId, { $unset: { department: 1 } });
    res.json({ success: true, message: 'Employee removed from department' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/departments/public (unauthenticated)
const getPublicDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .select('name code color icon')
      .sort({ name: 1 });
    res.json({ success: true, departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  addEmployee,
  removeEmployee,
  getPublicDepartments,
};
