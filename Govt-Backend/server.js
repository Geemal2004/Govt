const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// File storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Data directory setup
const DATA_DIR = './data';
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize data files
const initFile = (filename, defaultData) => {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
  }
};

// Initialize with sample data
initFile('users.json', [
  { id: 1, name: 'John Doe', email: 'john@email.com', nic: '123456789V', role: 'citizen' },
  { id: 2, name: 'Officer Smith', email: 'officer@gov.lk', role: 'officer', department: 'Immigration' }
]);

initFile('services.json', [
  { 
    id: 1, 
    name: 'Passport Application', 
    department: 'Immigration', 
    duration: 30,
    requiredDocs: ['NIC Copy', 'Birth Certificate', 'Photos'],
    description: 'New passport application service'
  },
  { 
    id: 2, 
    name: 'Driving License', 
    department: 'Motor Traffic', 
    duration: 45,
    requiredDocs: ['NIC Copy', 'Medical Certificate', 'Photos'],
    description: 'Driving license application'
  },
  { 
    id: 3, 
    name: 'Birth Certificate', 
    department: 'Registrar General', 
    duration: 20,
    requiredDocs: ['Hospital Discharge', 'Parent NICs'],
    description: 'Birth certificate issuance'
  }
]);

initFile('appointments.json', []);
initFile('feedback.json', []);

// Utility functions
const readData = (filename) => {
  const filepath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
};

const writeData = (filename, data) => {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
};

// Routes

// Get all services
app.get('/api/services', (req, res) => {
  try {
    const services = readData('services.json');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get services by department
app.get('/api/services/department/:dept', (req, res) => {
  try {
    const services = readData('services.json');
    const filtered = services.filter(s => s.department === req.params.dept);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Simple authentication
app.post('/api/login', (req, res) => {
  try {
    const { email } = req.body;
    const users = readData('users.json');
    const user = users.find(u => u.email === email);
    
    if (user) {
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
      res.status(401).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Book appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const { serviceId, userId, date, time, notes } = req.body;
    
    const appointments = readData('appointments.json');
    const services = readData('services.json');
    const users = readData('users.json');
    
    const service = services.find(s => s.id === parseInt(serviceId));
    const user = users.find(u => u.id === parseInt(userId));
    
    if (!service || !user) {
      return res.status(400).json({ error: 'Invalid service or user' });
    }
    
    const appointmentId = uuidv4();
    const qrData = `${appointmentId}:${date}:${time}:${service.name}`;
    const qrCode = await QRCode.toDataURL(qrData);
    
    const newAppointment = {
      id: appointmentId,
      serviceId: parseInt(serviceId),
      userId: parseInt(userId),
      serviceName: service.name,
      userName: user.name,
      userEmail: user.email,
      department: service.department,
      date,
      time,
      notes: notes || '',
      status: 'pending',
      qrCode,
      createdAt: new Date().toISOString(),
      documents: []
    };
    
    appointments.push(newAppointment);
    writeData('appointments.json', appointments);
    
    res.json({ success: true, appointment: newAppointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Get appointments for user
app.get('/api/appointments/user/:userId', (req, res) => {
  try {
    const appointments = readData('appointments.json');
    const userAppointments = appointments.filter(a => a.userId === parseInt(req.params.userId));
    res.json(userAppointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointments for officer by department
app.get('/api/appointments/department/:dept', (req, res) => {
  try {
    const appointments = readData('appointments.json');
    const deptAppointments = appointments.filter(a => a.department === req.params.dept);
    res.json(deptAppointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment status
app.put('/api/appointments/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const appointments = readData('appointments.json');
    const index = appointments.findIndex(a => a.id === req.params.id);
    
    if (index !== -1) {
      appointments[index].status = status;
      appointments[index].updatedAt = new Date().toISOString();
      writeData('appointments.json', appointments);
      res.json({ success: true, appointment: appointments[index] });
    } else {
      res.status(404).json({ error: 'Appointment not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Upload documents
app.post('/api/appointments/:id/documents', upload.array('documents'), (req, res) => {
  try {
    const appointments = readData('appointments.json');
    const index = appointments.findIndex(a => a.id === req.params.id);
    
    if (index !== -1) {
      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        uploadedAt: new Date().toISOString()
      }));
      
      appointments[index].documents = [...(appointments[index].documents || []), ...uploadedFiles];
      writeData('appointments.json', appointments);
      
      res.json({ success: true, documents: uploadedFiles });
    } else {
      res.status(404).json({ error: 'Appointment not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

// Submit feedback
app.post('/api/feedback', (req, res) => {
  try {
    const { appointmentId, rating, comment, userId } = req.body;
    const feedback = readData('feedback.json');
    
    const newFeedback = {
      id: uuidv4(),
      appointmentId,
      userId,
      rating: parseInt(rating),
      comment,
      createdAt: new Date().toISOString()
    };
    
    feedback.push(newFeedback);
    writeData('feedback.json', feedback);
    
    res.json({ success: true, feedback: newFeedback });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
  try {
    const appointments = readData('appointments.json');
    const feedback = readData('feedback.json');
    
    const totalAppointments = appointments.length;
    const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    
    const departmentStats = {};
    appointments.forEach(apt => {
      if (!departmentStats[apt.department]) {
        departmentStats[apt.department] = 0;
      }
      departmentStats[apt.department]++;
    });
    
    const avgRating = feedback.length > 0 
      ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
      : 0;
    
    res.json({
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      departmentStats,
      avgRating: Math.round(avgRating * 10) / 10,
      totalFeedback: feedback.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;