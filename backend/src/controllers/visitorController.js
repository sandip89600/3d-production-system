const VisitorSession = require('../models/VisitorSession');
const VisitorEvent = require('../models/VisitorEvent');
const VisitorNotification = require('../models/VisitorNotification');
const VisitorStatistic = require('../models/VisitorStatistic');
const { logger } = require('../utils/logger');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

let socketIO = null;

const User = require('../models/User');

// Helper to set Socket.IO instance
const setIO = (io) => {
  socketIO = io;
  
  // Real-time visitor tracking listener
  io.on('connection', async (socket) => {
    let userRole = socket.handshake.auth?.role;
    const userId = socket.handshake.auth?.userId;

    // Secure database lookup fallback if role is missing in handshake auth object
    if (!userRole && userId) {
      try {
        const user = await User.findById(userId);
        if (user) {
          userRole = user.role;
        }
      } catch (err) {
        logger.error('Error resolving user role during socket handshake:', err);
      }
    }

    if (userRole === 'admin' || userRole === 'developer') {
      socket.join('admin_analytics');
      logger.info(`🔌 Securely joined admin_analytics room for user: ${userId}`);
      
      // Send initial online count immediately on connection
      sendActiveVisitorsCount();
    }
  });
};

// Helper to send active visitor counts to admins
const sendActiveVisitorsCount = async () => {
  try {
    if (!socketIO) return;
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const activeCount = await VisitorSession.countDocuments({
      status: 'online',
      visitEnd: { $gte: thirtySecondsAgo }
    });
    socketIO.to('admin_analytics').emit('active_visitors_update', { activeCount });
  } catch (err) {
    logger.error('Failed to broadcast active visitors count:', err);
  }
};

// Geolocation fetch helper using native fetch
const getGeoData = async (ip) => {
  // Normalize loopback IPs to Nashik, Maharashtra, India for rich local demonstration data
  const localIps = ['::1', '127.0.0.1', '::ffff:127.0.0.1', '::'];
  const queryIp = localIps.includes(ip) ? '103.51.15.110' : ip;

  try {
    // Simple fetch with timeout
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`http://ip-api.com/json/${queryIp}?fields=status,message,country,regionName,city,timezone,lat,lon,isp`, {
      signal: controller.signal
    });
    clearTimeout(id);
    
    const data = await response.json();
    if (data && data.status === 'success') {
      return {
        country: data.country || 'India',
        state: data.regionName || 'Maharashtra',
        city: data.city || 'Nashik',
        timezone: data.timezone || 'Asia/Kolkata',
        latitude: data.lat || 20.00,
        longitude: data.lon || 73.78,
        isp: data.isp || 'Reliance Jio Infocomm'
      };
    }
  } catch (err) {
    logger.error(`Geo lookup failed for IP ${ip}: ${err.message}`);
  }

  // Fallback defaults
  return {
    country: 'India',
    state: 'Maharashtra',
    city: 'Nashik',
    timezone: 'Asia/Kolkata',
    latitude: 20.00,
    longitude: 73.78,
    isp: 'Local ISP Fallback'
  };
};

// User agent parser helper
const parseUserAgent = (uaString = '') => {
  let browser = 'Unknown';
  let browserVersion = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'Desktop';

  const ua = uaString.toLowerCase();

  // Device detection
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/mobi|android|iphone|ipod/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // OS detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('android')) os = 'Android';

  // Browser detection
  if (ua.includes('edg/')) {
    browser = 'Edge';
    const match = uaString.match(/Edg\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('chrome') || ua.includes('crios')) {
    browser = 'Chrome';
    const match = uaString.match(/Chrom(e|ios)\/([0-9.]+)/);
    if (match) browserVersion = match[2];
  } else if (ua.includes('safari')) {
    browser = 'Safari';
    const match = uaString.match(/Version\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('firefox') || ua.includes('fxios')) {
    browser = 'Firefox';
    const match = uaString.match(/Firefox\/([0-9.]+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('opr/') || ua.includes('opera')) {
    browser = 'Opera';
  }

  return { browser, browserVersion, os, deviceType };
};

// 1. Session start tracker
const trackSessionStart = async (req, res) => {
  try {
    const { visitorId, sessionId, screenResolution, language, referralSource, landingPage, userAgent } = req.body;
    if (!visitorId || !sessionId) {
      return res.status(400).json({ success: false, message: 'Missing visitorId or sessionId' });
    }

    // Extract client IP address supporting proxy headers
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '';
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }

    // Check if session already exists
    let session = await VisitorSession.findOne({ sessionId });
    if (session) {
      return res.json({ success: true, message: 'Session already exists', session });
    }

    // Check if returning visitor
    const existingSessionsCount = await VisitorSession.countDocuments({ visitorId });
    const isNewVisitor = existingSessionsCount === 0;

    // Fetch Geo location
    const geo = await getGeoData(ip);

    // Parse User agent
    const parsedUA = parseUserAgent(userAgent || req.headers['user-agent'] || '');

    session = new VisitorSession({
      sessionId,
      visitorId,
      ipAddress: ip,
      ...geo,
      ...parsedUA,
      screenResolution: screenResolution || 'Unknown',
      language: language || 'en',
      userAgent: userAgent || req.headers['user-agent'] || '',
      referralSource: referralSource || 'Direct',
      landingPage: landingPage || '/',
      visitStart: new Date(),
      visitEnd: new Date(),
      status: 'online',
      isNewVisitor
    });

    await session.save();

    // Log the landing event
    const initialEvent = new VisitorEvent({
      sessionId,
      type: 'page_view',
      page: landingPage || '/',
      meta: { title: 'Landing Page' }
    });
    await initialEvent.save();

    // Create a VisitorNotification
    const notification = new VisitorNotification({
      sessionId,
      visitorId,
      country: geo.country,
      city: geo.city,
      deviceType: parsedUA.deviceType,
      browser: parsedUA.browser,
      visitedPage: landingPage || '/'
    });
    await notification.save();

    // Broadcast to admins
    if (socketIO) {
      socketIO.to('admin_analytics').emit('new_visitor', {
        id: notification._id,
        sessionId,
        country: geo.country,
        city: geo.city,
        deviceType: parsedUA.deviceType,
        browser: parsedUA.browser,
        visitedPage: landingPage || '/',
        time: new Date().toLocaleTimeString(),
        timestamp: notification.createdAt
      });
      
      // Update online count
      sendActiveVisitorsCount();
    }

    res.status(201).json({ success: true, session });
  } catch (err) {
    logger.error('Error starting visitor session:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Session Heartbeat tracker
const trackHeartbeat = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Missing sessionId' });
    }

    const session = await VisitorSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const now = new Date();
    session.visitEnd = now;
    session.status = 'online';
    session.duration = Math.max(0, Math.floor((now.getTime() - session.visitStart.getTime()) / 1000));
    await session.save();

    // Broadcast updated active count
    sendActiveVisitorsCount();

    res.json({ success: true, duration: session.duration });
  } catch (err) {
    logger.error('Error handling visitor heartbeat:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Visitor events logger
const trackEvent = async (req, res) => {
  try {
    const { sessionId, type, page, meta } = req.body;
    if (!sessionId || !type || !page) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const event = new VisitorEvent({
      sessionId,
      type,
      page,
      meta: meta || {}
    });
    await event.save();

    // Update active page/end values in session
    const session = await VisitorSession.findOne({ sessionId });
    if (session) {
      session.visitEnd = new Date();
      session.duration = Math.max(0, Math.floor((session.visitEnd.getTime() - session.visitStart.getTime()) / 1000));
      if (type === 'page_view') {
        session.exitPage = page;
      }
      await session.save();
    }

    // Broadcast event feed live to Admin Panel
    if (socketIO) {
      socketIO.to('admin_analytics').emit('visitor_event', {
        sessionId,
        type,
        page,
        meta,
        timestamp: new Date()
      });
    }

    res.status(201).json({ success: true });
  } catch (err) {
    logger.error('Error tracking visitor event:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Retrieve live stats
const getLiveAnalytics = async (req, res) => {
  try {
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const startOfMonth = new Date(startOfToday);
    startOfMonth.setDate(1);

    // Run parallel aggregates for dashboard performance
    const [
      onlineCount,
      todayCount,
      yesterdayCount,
      weekCount,
      monthCount,
      totalCount,
      uniqueCount,
      newCount,
      returningCount,
      avgDurationResult,
      topGeoResult,
      topPagesResult
    ] = await Promise.all([
      // Online Visitors
      VisitorSession.countDocuments({ status: 'online', visitEnd: { $gte: thirtySecondsAgo } }),
      // Today
      VisitorSession.countDocuments({ visitStart: { $gte: startOfToday } }),
      // Yesterday
      VisitorSession.countDocuments({ visitStart: { $gte: startOfYesterday, $lt: startOfToday } }),
      // This Week
      VisitorSession.countDocuments({ visitStart: { $gte: startOfWeek } }),
      // This Month
      VisitorSession.countDocuments({ visitStart: { $gte: startOfMonth } }),
      // Total
      VisitorSession.countDocuments(),
      // Unique Visitors (by visitorId count)
      VisitorSession.distinct('visitorId').then(arr => arr.length),
      // New vs Returning
      VisitorSession.countDocuments({ isNewVisitor: true }),
      VisitorSession.countDocuments({ isNewVisitor: false }),
      // Avg session duration
      VisitorSession.aggregate([
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ]),
      // Top Countries / Cities
      VisitorSession.aggregate([
        { $group: { _id: { country: '$country', city: '$city' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),
      // Top visited pages
      VisitorEvent.aggregate([
        { $match: { type: 'page_view' } },
        { $group: { _id: '$page', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ])
    ]);

    const activeCountry = topGeoResult[0]?._id?.country || 'India';
    const activeCity = topGeoResult[0]?._id?.city || 'Nashik';
    const activePage = topPagesResult[0]?._id || '/portfolio';

    // Heartbeat pings might keep statuses online, toggle offline for stale sessions
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await VisitorSession.updateMany(
      { status: 'online', visitEnd: { $lt: tenMinutesAgo } },
      { $set: { status: 'offline' } }
    );

    res.json({
      success: true,
      stats: {
        online: onlineCount,
        today: todayCount,
        yesterday: yesterdayCount,
        week: weekCount,
        month: monthCount,
        total: totalCount,
        unique: uniqueCount,
        new: newCount,
        returning: returningCount,
        avgDuration: Math.round(avgDurationResult[0]?.avgDuration || 0),
        activeCountry,
        activeCity,
        activePage
      }
    });
  } catch (err) {
    logger.error('Error fetching live analytics:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Paginated and filterable Live Visitors List
const getLiveVisitorsList = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, device, source } = req.query;
    const query = {};

    // Apply Search (Matches IP, Country, City, OS, Browser)
    if (search) {
      query.$or = [
        { ipAddress: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { browser: { $regex: search, $options: 'i' } },
        { os: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply Filters
    if (status) {
      if (status === 'online') {
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
        query.status = 'online';
        query.visitEnd = { $gte: thirtySecondsAgo };
      } else {
        query.$or = [
          { status: 'offline' },
          { visitEnd: { $lt: new Date(Date.now() - 30 * 1000) } }
        ];
      }
    }
    if (device) query.deviceType = device;
    if (source) query.referralSource = source;

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort online users first, then by visit start time
    const list = await VisitorSession.find(query)
      .sort({ status: 1, visitStart: -1 })
      .skip(skipCount)
      .limit(parseInt(limit));

    const total = await VisitorSession.countDocuments(query);

    // Fetch timeline events for each session in parallel
    const listWithTimelines = await Promise.all(list.map(async (sess) => {
      const timeline = await VisitorEvent.find({ sessionId: sess.sessionId })
        .sort({ timestamp: 1 })
        .select('page type timestamp meta');
      return {
        ...sess.toObject(),
        timeline
      };
    }));

    res.json({
      success: true,
      data: listWithTimelines,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    logger.error('Error fetching live visitors list:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Generate historical charts
const getHistoricalCharts = async (req, res) => {
  try {
    const { range = 'week' } = req.query; // 'week' | 'month' | 'year'
    const now = new Date();
    let startDate = new Date();

    if (range === 'week') startDate.setDate(now.getDate() - 7);
    else if (range === 'month') startDate.setDate(now.getDate() - 30);
    else if (range === 'year') startDate.setDate(now.getDate() - 365);

    // Aggregate daily stats
    const dailySessions = await VisitorSession.aggregate([
      { $match: { visitStart: { $gte: startDate } } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitStart" } },
          sessions: { $sum: 1 },
          uniques: { $addToSet: "$visitorId" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format for charts
    const chartData = dailySessions.map(d => ({
      date: d._id,
      sessions: d.sessions,
      uniques: d.uniques.length
    }));

    // Device breakdown
    const devices = await VisitorSession.aggregate([
      { $match: { visitStart: { $gte: startDate } } },
      { $group: { _id: "$deviceType", count: { $sum: 1 } } }
    ]);

    // Browser breakdown
    const browsers = await VisitorSession.aggregate([
      { $match: { visitStart: { $gte: startDate } } },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Referral sources
    const sources = await VisitorSession.aggregate([
      { $match: { visitStart: { $gte: startDate } } },
      { $group: { _id: "$referralSource", count: { $sum: 1 } } }
    ]);

    // Top Pages
    const topPages = await VisitorEvent.aggregate([
      { $match: { type: 'page_view', timestamp: { $gte: startDate } } },
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      charts: {
        traffic: chartData,
        devices: devices.map(d => ({ name: d._id, value: d.count })),
        browsers: browsers.map(b => ({ name: b._id, value: b.count })),
        sources: sources.map(s => ({ name: s._id, value: s.count })),
        pages: topPages.map(p => ({ name: p._id, value: p.count }))
      }
    });
  } catch (err) {
    logger.error('Error generating historical charts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 7. Export report endpoint
const exportAnalyticsReport = async (req, res) => {
  try {
    const { format = 'csv' } = req.query; // 'csv' | 'xlsx' | 'pdf'
    const sessions = await VisitorSession.find().sort({ visitStart: -1 }).limit(1000);

    if (format === 'csv' || format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Visitor Analytics');

      sheet.columns = [
        { header: 'Session ID', key: 'sessionId', width: 25 },
        { header: 'Visitor ID', key: 'visitorId', width: 25 },
        { header: 'IP Address', key: 'ipAddress', width: 18 },
        { header: 'Country', key: 'country', width: 15 },
        { header: 'City', key: 'city', width: 15 },
        { header: 'Device', key: 'deviceType', width: 12 },
        { header: 'Browser', key: 'browser', width: 15 },
        { header: 'OS', key: 'os', width: 12 },
        { header: 'Source', key: 'referralSource', width: 15 },
        { header: 'Start Time', key: 'visitStart', width: 22 },
        { header: 'Duration (s)', key: 'duration', width: 12 },
        { header: 'Exit Page', key: 'exitPage', width: 20 }
      ];

      sessions.forEach(sess => {
        sheet.addRow({
          sessionId: sess.sessionId,
          visitorId: sess.visitorId,
          ipAddress: sess.ipAddress,
          country: sess.country,
          city: sess.city,
          deviceType: sess.deviceType,
          browser: sess.browser,
          os: sess.os,
          referralSource: sess.referralSource,
          visitStart: sess.visitStart.toISOString().replace('T', ' ').substring(0, 19),
          duration: sess.duration,
          exitPage: sess.exitPage || sess.landingPage
        });
      });

      if (format === 'xlsx') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="all3dstudio_visitor_analytics.xlsx"');
        await workbook.xlsx.write(res);
        return res.end();
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="all3dstudio_visitor_analytics.csv"');
        await workbook.csv.write(res);
        return res.end();
      }
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="all3dstudio_visitor_analytics.pdf"');
      doc.pipe(res);

      // Title header
      doc.fillColor('#f59e0b').fontSize(24).text('All 3D Studio', { align: 'center' });
      doc.fillColor('#ffffff').fontSize(14).text('Real-Time Visitor Analytics Report', { align: 'center' });
      doc.moveDown();

      doc.fillColor('#94a3b8').fontSize(9).text(`Generated On: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown();

      doc.fillColor('#cbd5e1').fontSize(10);
      
      // Draw Table Header
      let y = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('IP Address', 30, y);
      doc.text('Location', 120, y);
      doc.text('Device/Browser', 240, y);
      doc.text('Source', 380, y);
      doc.text('Duration', 470, y);
      doc.text('Start Time', 520, y);
      
      doc.moveTo(30, y + 15).lineTo(565, y + 15).strokeColor('#1e293b').stroke();
      doc.font('Helvetica');

      y += 25;
      sessions.slice(0, 25).forEach(sess => {
        if (y > 750) {
          doc.addPage();
          y = 50;
        }
        
        doc.text(sess.ipAddress, 30, y);
        doc.text(`${sess.city}, ${sess.country}`, 120, y);
        doc.text(`${sess.deviceType} / ${sess.browser}`, 240, y);
        doc.text(sess.referralSource, 380, y);
        doc.text(`${sess.duration}s`, 470, y);
        
        const dateStr = sess.visitStart.toLocaleDateString();
        doc.text(dateStr, 520, y);
        
        y += 20;
      });

      doc.end();
      return;
    }

    res.status(400).json({ success: false, message: 'Invalid export format' });
  } catch (err) {
    logger.error('Error exporting analytics report:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  setIO,
  trackSessionStart,
  trackHeartbeat,
  trackEvent,
  getLiveAnalytics,
  getLiveVisitorsList,
  getHistoricalCharts,
  exportAnalyticsReport
};
