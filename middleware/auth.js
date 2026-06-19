const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  //  console.log("🔥 AUTH MIDDLEWARE HIT");
  const token = req.headers.authorization?.split(" ")[1];
  // console.log("TOKEN:", token);
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.LECTURER_JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = verifyToken;