const express = require("express")
const {registerStudent, loginStudent, getallcoursebystudent, registerCourse, getMyCourses, unregisterCourse } = require("../Controllers/student.controllers")
const router = express.Router()
const verifyStudentToken = require("../middleware/authstudent");


router.post("/register", registerStudent)
router.post("/login", loginStudent)
router.get("/getallcoursebystudent", getallcoursebystudent)
router.post("/register-course", verifyStudentToken, registerCourse)
router.get("/my-courses", verifyStudentToken, getMyCourses)
router.delete( "/unregister-course/:courseId", verifyStudentToken, unregisterCourse)

module.exports = router