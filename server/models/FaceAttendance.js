const mongoose = require("mongoose");

/** Face-recognition daily presence log (separate from library seat Attendance). */
const faceAttendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    /** Second face scan same day — face check-out time (HH:mm:ss). */
    checkOutTime: {
      type: String,
      default: null,
      trim: true,
    },
    /** Hours between face check-in and face check-out (same day). */
    totalFaceHours: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["Present"],
      default: "Present",
    },
  },
  { timestamps: true }
);

faceAttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("FaceAttendance", faceAttendanceSchema);
