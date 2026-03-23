const Admin = require("../models/Admin");

const seedDefaultAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || "admin@library.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123";
  const name = process.env.ADMIN_NAME || "Library Admin";

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    return existingAdmin;
  }

  const admin = await Admin.create({
    name,
    email,
    password,
  });

  console.log(`Default admin ready: ${admin.email}`);
  return admin;
};

module.exports = seedDefaultAdmin;
