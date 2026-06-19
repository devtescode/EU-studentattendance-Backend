const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const userRoutes = require('./Routes/attendance.routes');
const adminRoutes = require('./Routes/admin.routes');
const lecturersRoutes = require('./Routes/lecturer.routes');
const studentsRoutes = require('./Routes/student.routes');
const courseRoutes = require('./Routes/course.routes');



const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
const URI = process.env.URI;

app.use(cors());
app.use(express.urlencoded({ extended: true, limit: '200mb' }));
app.use(express.json({ limit: '200mb' }));

mongoose
    .connect(URI)
    .then(() => {
        console.log('Database connected successfully Attendance Backend');
    })
    .catch((err) => {
        console.error('Database connection error:', err);
});


app.use('/admin', adminRoutes);
app.use('/attendance', userRoutes);
app.use("/lecturers", lecturersRoutes)
app.use("/students", studentsRoutes)
app.use("/session", courseRoutes)

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to Attendance Backend'});
});

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
