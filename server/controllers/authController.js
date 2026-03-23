const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Admin = require("../models/Admin");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const buildPhotoPath = (file) => (file ? "/uploads/profiles/" + file.filename : "");

const signupStudent = async (req, res) => {
  console.log("POST /api/auth/student/signup req.body:", req.body);

  try {
    const { name, rollNo, course, phone, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "name, email, and password are required",
      });
    }

    if (!rollNo || !phone) {
      return res.status(400).json({
        success: false,
        error: "rollNo and phone are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingStudent = await Student.findOne({
      $or: [{ email: normalizedEmail }, { rollNo: rollNo.trim() }],
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        error: "Student with this email or roll number already exists",
      });
    }

    const imagePath = buildPhotoPath(req.file);
    const student = await Student.create({
      name: name.trim(),
      rollNo: rollNo.trim(),
      course: course?.trim() || "",
      phone: phone.trim(),
      email: normalizedEmail,
      password,
      profilePhoto: imagePath,
      profileImage: imagePath,
    });

    return res.status(201).json({
      success: true,
      message: "Student registered successfully",
      token: signToken(student),
      user: student,
    });
  } catch (error) {
    console.error("Student signup failed:", error.stack || error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email: email?.toLowerCase().trim() });
    if (!student || !(await student.matchPassword(password || ""))) {
      return res.status(401).json({ success: false, error: "Invalid student credentials" });
    }

    return res.json({
      success: true,
      message: "Login successful",
      token: signToken(student),
      user: student,
    });
  } catch (error) {
    console.error("Student login failed:", error.stack || error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email?.toLowerCase().trim() });
    if (!admin || !(await admin.matchPassword(password || ""))) {
      return res.status(401).json({ success: false, error: "Invalid admin credentials" });
    }

    return res.json({
      success: true,
      message: "Admin login successful",
      token: signToken(admin),
      user: admin,
    });
  } catch (error) {
    console.error("Admin login failed:", error.stack || error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    return res.json({ success: true, user: req.user });
  } catch (error) {
    console.error("Fetching current user failed:", error.stack || error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};

module.exports = {
  signupStudent,
  loginStudent,
  loginAdmin,
  getCurrentUser,
};
