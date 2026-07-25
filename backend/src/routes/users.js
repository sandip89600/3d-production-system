const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser, getEmployees, getAdmins } = require('../controllers/userController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

router.use(authenticateJWT);
router.get('/employees', getEmployees);
router.get('/admins', requireRole('developer', 'admin'), getAdmins);
router.get('/', requireRole('developer', 'admin'), getUsers);
router.get('/:id', requireRole('developer', 'admin'), getUserById);
router.post('/', requireRole('developer', 'admin'), createUser);
router.put('/:id', requireRole('developer', 'admin'), updateUser);
router.delete('/:id', requireRole('developer', 'admin'), deleteUser);

module.exports = router;
