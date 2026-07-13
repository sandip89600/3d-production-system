const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser, getEmployees, getAdmins } = require('../controllers/userController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

router.use(authenticateJWT);
router.get('/employees', getEmployees);
router.get('/admins', requireRole('superadmin', 'admin'), getAdmins);
router.get('/', requireRole('superadmin', 'admin'), getUsers);
router.get('/:id', requireRole('superadmin', 'admin'), getUserById);
router.post('/', requireRole('superadmin', 'admin'), createUser);
router.put('/:id', requireRole('superadmin', 'admin'), updateUser);
router.delete('/:id', requireRole('superadmin', 'admin'), deleteUser);

module.exports = router;
