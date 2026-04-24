const Admin = require("../models/admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Adminmodel = require("../models/admin");

// const AdminAuthCheck = async (req, res, next) => {
//   const accessToken = req.cookies?.adminAccessToken;
//   const refreshToken = req.cookies?.adminRefreshToken;

//   //  No tokens at all
//   if (!accessToken && !refreshToken) {
//     return res.redirect("/admin/login");
//   }

//   //  Try ACCESS TOKEN
//   if (accessToken) {
//     try {
//       const decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);

//       req.admin = decoded;
//       return next();
//     } catch (err) {
//       // expired → move to refresh
//     }
//   }

//   //  Try REFRESH TOKEN
//   if (!refreshToken) {
//     return res.redirect("/admin/login");
//   }

//   try {
//     const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY);

//     const user = await Admin.findById(decodedRefresh.userId);

//     //  Token mismatch (VERY IMPORTANT SECURITY CHECK)
//     if (!user || user.refreshToken !== refreshToken) {
//       res.clearCookie("adminAccessToken");
//       res.clearCookie("adminRefreshToken");
//       return res.redirect("/admin/login");
//     }

//     // Generate NEW access token
//     const newAccessToken = jwt.sign(
//       {
//         userId: user._id,
//         email: user.email,
//         role: user.role,
//       },
//       process.env.JWT_SECRET_KEY,
//       { expiresIn: "1m" }
//     );

//     //  Set new access token
//     res.cookie("adminAccessToken", newAccessToken, {
//       httpOnly: true,
//       maxAge: 1 * 60 * 1000,
//     });

//     req.admin = {
//       userId: user._id,
//       email: user.email,
//       role: user.role,
//     };

//     return next();
//   } catch (error) {
//     res.clearCookie("adminAccessToken");
//     res.clearCookie("adminRefreshToken");
//     return res.redirect("/admin/login");
//   }
// };

const adminAuthCheck = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ msg: "No token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const admin = await Adminmodel.findById(decoded.userId);

    if (!admin) {
      return res.status(401).json({ msg: "Admin not found" });
    }

    req.admin = admin

    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

//auto gen api(generate at login time saved in DB) key verification
const verifyAdminApiKey = async (req, res, next) => {
  try {
    const key = req.headers["x-api-key"]?.trim();

    if (!key) {
      return res.status(401).json({ msg: "API key required" });
    }

    if (!req.admin || !req.admin.apiKey) {
      return res.status(403).json({ msg: "Unauthorized access" });
    }

    const admin = await Adminmodel.findById(req.admin._id)

    const isMatch = await bcrypt.compare(key, admin.apiKey);

    if (!isMatch) {
      return res.status(403).json({
        msg: "Invalid API key, please enter a valid key",
      });
    }

    next();
  } catch (err) {
    console.error("API KEY VERIFY ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};


module.exports = { adminAuthCheck, verifyAdminApiKey };
