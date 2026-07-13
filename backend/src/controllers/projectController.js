const Project = require('../models/Project');
const Department = require('../models/Department');
const ProjectAssignment = require('../models/ProjectAssignment');
const ProgressLog = require('../models/ProgressLog');
const User = require('../models/User');
const whatsappService = require('../services/whatsappCloudService');
const notificationService = require('../services/notificationService');
const { logActivity } = require('../middleware/auth');
const storageService = require('../services/storageService');
const path = require('path');
const ProjectDownloadLog = require('../models/ProjectDownloadLog');

// GET /api/projects
const getProjects = async (req, res) => {
  try {
    const { status, department, priority, page = 1, limit = 20, search, uploadedBy } = req.query;
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      filter.$or = [
        { status: 'available' },
        { assignedTo: req.user._id },
      ];
    } else if (req.user.role === 'admin') {
      filter.uploadedBy = req.user._id;
    }

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (priority) filter.priority = priority;
    if (uploadedBy) filter.uploadedBy = uploadedBy;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('department', 'name code color icon')
        .populate('uploadedBy', 'name email adminCode')
        .populate('assignedTo', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Project.countDocuments(filter),
    ]);

    res.json({ success: true, projects, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('department', 'name code color icon whatsappGroupName')
      .populate('uploadedBy', 'name email adminCode')
      .populate('assignedTo', 'name email avatar')
      .populate('reviewedBy', 'name email');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects (with file upload)
const createProject = async (req, res) => {
  try {
    const { name, type, department, description, priority, deadline, clientName, estimatedDays, tags } = req.body;

    const dept = await Department.findById(department).populate('employees admin');
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

    const projectData = {
      name, type, department, description, priority,
      deadline: new Date(deadline),
      uploadedBy: req.user._id,
      clientName,
      estimatedDays: estimatedDays ? parseInt(estimatedDays) : undefined,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      status: 'available',
    };

    if (req.file) {
      // Upload to cloud storage (S3 / Cloudinary / local fallback)
      const uploaded = await storageService.uploadFile({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        folder: 'projects',
        uploadedBy: req.user._id,
      });
      projectData.fileUrl = uploaded.url;
      projectData.fileName = req.file.originalname;
      projectData.fileSize = req.file.size;
      projectData.fileType = path.extname(req.file.originalname).toLowerCase();
    }

    const project = await Project.create(projectData);

    // WhatsApp notification
    const uploader = req.user;
    const waResult = await whatsappService.notifyNewProject(project, uploader);

    if (waResult.success) {
      await project.updateOne({ whatsappNotified: true, whatsappNotifiedAt: new Date() });
    }

    // In-app notifications to department employees
    const recipientIds = dept.employees.map(e => e._id || e);
    if (dept.admin) recipientIds.push(dept.admin._id || dept.admin);

    await notificationService.notifyDepartmentEmployees(recipientIds, {
      sender: req.user._id,
      type: 'project_upload',
      title: '🎬 New Project Available',
      message: `${name} (${project.projectId}) has been uploaded to ${dept.name}. Click to view.`,
      data: { projectId: project._id },
      link: `/projects/${project._id}`,
    });

    await logActivity(req, 'project_upload', `Project: ${name} (${project.projectId})`, { projectId: project._id, department: dept.name });

    const populated = await Project.findById(project._id)
      .populate('department', 'name code color icon')
      .populate('uploadedBy', 'name email adminCode');

    res.status(201).json({
      success: true,
      message: 'Project uploaded successfully',
      project: populated,
      whatsappNotified: waResult.success,
      whatsappMessage: waResult.message,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const { name, type, description, priority, deadline, status, reviewNotes, estimatedDays, tags, clientName } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, type, description, priority, deadline, status, reviewNotes, estimatedDays, tags, clientName },
      { new: true }
    ).populate('department', 'name code').populate('uploadedBy', 'name email adminCode');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await logActivity(req, 'project_update', `Project: ${project.name}`);
    res.json({ success: true, message: 'Project updated', project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/:id/pickup — Employee picks up a project
const pickupProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('department');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Project is not available for pickup' });
    }

    const existing = await ProjectAssignment.findOne({ project: project._id });
    if (existing) return res.status(400).json({ success: false, message: 'Project already assigned' });

    const assignment = await ProjectAssignment.create({
      project: project._id,
      employee: req.user._id,
    });

    await project.updateOne({ status: 'in-progress', assignedTo: req.user._id });

    await logActivity(req, 'project_pickup', `Project: ${project.name} (${project.projectId})`, { projectId: project._id });

    // WhatsApp notification
    try {
      await whatsappService.notifyProjectPicked(project, req.user);
    } catch (err) {
      console.error('Error sending pickup WhatsApp notification:', err.message);
    }

    // Notify admin
    if (project.department?.admin) {
      await notificationService.create({
        recipient: project.department.admin,
        sender: req.user._id,
        type: 'project_assigned',
        title: '👤 Project Picked Up',
        message: `${req.user.name} has picked up "${project.name}" (${project.projectId})`,
        data: { projectId: project._id, assignmentId: assignment._id },
        link: `/projects/${project._id}`,
      });
    }

    const populated = await ProjectAssignment.findById(assignment._id)
      .populate('project', 'name type priority deadline')
      .populate('employee', 'name email');

    res.status(201).json({ success: true, message: 'Project picked up successfully', assignment: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/:id/progress — Employee updates daily progress
const updateProgress = async (req, res) => {
  try {
    const { progress, notes, blockers, day } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const assignment = await ProjectAssignment.findOne({
      project: project._id,
      employee: req.user._id,
    });
    if (!assignment) return res.status(403).json({ success: false, message: 'Not assigned to this project' });

    const dayNum = day || (assignment.totalDaysWorked + 1);

    // Upsert progress log for this day
    const log = await ProgressLog.findOneAndUpdate(
      { assignment: assignment._id, day: dayNum },
      {
        project: project._id,
        employee: req.user._id,
        progressPercentage: parseInt(progress),
        notes,
        blockers,
        date: new Date(),
        uploadedFiles: req.files
          ? await Promise.all(
              req.files.map(async (f) => {
                const up = await storageService.uploadFile({
                  buffer: f.buffer,
                  originalName: f.originalname,
                  mimeType: f.mimetype,
                  fileSize: f.size,
                  folder: 'deliverables',
                  uploadedBy: req.user._id,
                  projectId: project._id,
                });
                return {
                  fileName: f.originalname,
                  fileUrl: up.url,
                  fileSize: f.size,
                  fileType: path.extname(f.originalname),
                };
              })
            )
          : [],
      },
      { upsert: true, new: true }
    );

    // Update assignment
    await assignment.updateOne({
      progress: parseInt(progress),
      totalDaysWorked: dayNum,
    });

    // Update project progress
    await project.updateOne({ progress: parseInt(progress) });

    await logActivity(req, 'progress_update', `Project: ${project.name} (${project.projectId})`, { day: dayNum, progress });

    // WhatsApp notification
    try {
      await whatsappService.notifyProgressUpdated(project, req.user, parseInt(progress));
    } catch (err) {
      console.error('Error sending progress WhatsApp notification:', err.message);
    }

    res.json({ success: true, message: 'Progress updated', log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/:id/submit-review
const submitForReview = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status: 'review' },
      { new: true }
    ).populate('department');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const assignment = await ProjectAssignment.findOneAndUpdate(
      { project: project._id, employee: req.user._id },
      { status: 'review', reviewRequestedAt: new Date() },
      { new: true }
    );

    // Notify admin
    if (project.department?.admin) {
      await notificationService.create({
        recipient: project.department.admin,
        sender: req.user._id,
        type: 'review_request',
        title: '📋 Review Requested',
        message: `${req.user.name} submitted "${project.name}" (${project.projectId}) for review`,
        data: { projectId: project._id },
        link: `/projects/${project._id}`,
      });
    }

    await logActivity(req, 'review_submit', `Project: ${project.name} (${project.projectId})`);
    res.json({ success: true, message: 'Submitted for review', project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/:id/approve
const approveProject = async (req, res) => {
  try {
    const { notes } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', reviewedBy: req.user._id, reviewNotes: notes, completedAt: new Date(), progress: 100 },
      { new: true }
    ).populate('department assignedTo');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    await ProjectAssignment.findOneAndUpdate(
      { project: project._id },
      { status: 'completed', completedDate: new Date(), approvedBy: req.user._id, progress: 100 }
    );

    // Notify employee
    if (project.assignedTo) {
      await notificationService.create({
        recipient: project.assignedTo._id,
        sender: req.user._id,
        type: 'review_approved',
        title: '✅ Project Approved!',
        message: `"${project.name}" (${project.projectId}) has been approved. Great work!`,
        data: { projectId: project._id },
      });
    }

    // WhatsApp notification
    if (project.assignedTo) {
      try {
        await whatsappService.notifyProjectCompleted(project, project.assignedTo);
      } catch (err) {
        console.error('Error sending completion WhatsApp notification:', err.message);
      }
    }

    await logActivity(req, 'review_approve', `Project: ${project.name} (${project.projectId})`);
    res.json({ success: true, message: 'Project approved and completed', project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/:id/reject
const rejectProject = async (req, res) => {
  try {
    const { notes } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status: 'in-progress', reviewNotes: notes, reviewedBy: req.user._id },
      { new: true }
    ).populate('assignedTo');

    await ProjectAssignment.findOneAndUpdate(
      { project: project._id },
      { status: 'active', adminReviewNotes: notes }
    );

    if (project.assignedTo) {
      await notificationService.create({
        recipient: project.assignedTo._id,
        sender: req.user._id,
        type: 'review_rejected',
        title: '🔄 Changes Requested',
        message: `"${project.name}" (${project.projectId}) needs revisions. Notes: ${notes}`,
        data: { projectId: project._id },
      });
    }

    await logActivity(req, 'review_reject', `Project: ${project.name} (${project.projectId})`, { notes });
    res.json({ success: true, message: 'Revisions requested', project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/:id/progress-logs
const getProgressLogs = async (req, res) => {
  try {
    const assignment = await ProjectAssignment.findOne({
      project: req.params.id,
      ...(req.user.role === 'employee' ? { employee: req.user._id } : {}),
    });

    const logs = await ProgressLog.find({ project: req.params.id })
      .populate('employee', 'name email avatar')
      .sort({ day: 1 });

    res.json({ success: true, logs, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await logActivity(req, 'project_delete', `Project: ${project.name} (${project.projectId})`);
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/:id/download-secure
const getSecureDownloadUrl = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!project.fileName) return res.status(400).json({ success: false, message: 'Project has no file uploaded' });

    // Log the download request
    await ProjectDownloadLog.create({
      project: project._id,
      employee: req.user._id,
      fileName: project.fileName,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    await logActivity(req, 'project_download', `Downloaded file for project: ${project.name} (${project.projectId})`, { projectId: project._id });

    // Generate signed URL (expires in 24 hours = 86400 seconds)
    const FileModel = require('../models/File');
    const fileRecord = await FileModel.findOne({ projectId: project._id, isDeleted: false });

    let downloadUrl = project.fileUrl;
    if (fileRecord) {
      downloadUrl = await storageService.getSignedUrl(fileRecord._id, 86400);
    }

    res.json({ success: true, downloadUrl });
  } catch (error) {
    console.error('Error generating secure download URL:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/:id/download-logs
const getProjectDownloadLogs = async (req, res) => {
  try {
    const logs = await ProjectDownloadLog.find({ project: req.params.id })
      .populate('employee', 'name email role adminCode')
      .sort({ createdAt: -1 });
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProjects, getProjectById, createProject, updateProject, deleteProject,
  pickupProject, updateProgress, submitForReview, approveProject, rejectProject, getProgressLogs,
  getSecureDownloadUrl, getProjectDownloadLogs,
};
