const generateStudentId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `LIB-${timestamp}${random}`;
};

module.exports = generateStudentId;
