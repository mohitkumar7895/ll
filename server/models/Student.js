const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const generateStudentId = require("../utils/generateStudentId");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rollNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    studentId: {
      type: String,
      unique: true,
      index: true,
    },
    course: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    /** Primary path for face attendance (kept in sync with profilePhoto on upload). */
    profileImage: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "student",
    },
    penaltyAmount: {
      type: Number,
      default: 0,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

studentSchema.pre("validate", function () {
  if (!this.studentId) {
    this.studentId = generateStudentId();
  }
});

studentSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

studentSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

studentSchema.set("toJSON", {
  transform: (_, returnedObject) => {
    delete returnedObject.password;
    delete returnedObject.__v;
    return returnedObject;
  },
});

module.exports = mongoose.model("Student", studentSchema);
