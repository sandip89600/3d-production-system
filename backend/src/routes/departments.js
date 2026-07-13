const express = require('express');
const router = express.Router();
const {
  getDepartments, getDepartmentById, createDepartment, updateDepartment, addEmployee, removeEmployee, getPublicDepartments,
} = require('../controllers/departmentController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

router.get('/public', getPublicDepartments);

router.use(authenticateJWT);
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', requireRole('superadmin', 'admin'), createDepartment);
router.put('/:id', requireRole('superadmin', 'admin'), updateDepartment);
router.post('/:id/employees', requireRole('superadmin', 'admin'), addEmployee);
router.delete('/:id/employees/:employeeId', requireRole('superadmin', 'admin'), removeEmployee);

module.exports = router;
