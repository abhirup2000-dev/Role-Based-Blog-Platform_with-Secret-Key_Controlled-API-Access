const WriterModel = require("../models/writer");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs')

// const WriterAuthCheck = async (req, res, next) => {
//   const accessToken = req.cookies?.writerAccessToken;
//   const refreshToken = req.cookies?.writerRefreshToken;

//   //  No tokens at all
//   if (!accessToken && !refreshToken) {
//     return res.redirect("/writer/login");
//   }

//   //  Try ACCESS TOKEN
//   if (accessToken) {
//     try {
//       const decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);

//       req.writer = decoded;
//       return next();
//     } catch (err) {
//       // expired → move to refresh
//     }
//   }

//   //  Try REFRESH TOKEN
//   if (!refreshToken) {
//     return res.redirect("/writer/login");
//   }

//   try {
//     const decodedRefresh = jwt.verify(
//       refreshToken,
//       process.env.JWT_REFRESH_SECRET_KEY,
//     );

//     const user = await Writer.findById(decodedRefresh.userId);

//     //  Token mismatch (VERY IMPORTANT SECURITY CHECK)
//     if (!user || user.refreshToken !== refreshToken) {
//       res.clearCookie("writerAccessToken");
//       res.clearCookie("writerRefreshToken");
//       return res.redirect("/writer/login");
//     }

//     // Generate NEW access token
//     const newAccessToken = jwt.sign(
//       {
//         userId: user._id,
//         email: user.email,
//         role: user.role,
//       },
//       process.env.JWT_SECRET_KEY,
//       { expiresIn: "1m" },
//     );

//     //  Set new access token
//     res.cookie("writerAccessToken", newAccessToken, {
//       httpOnly: true,
//       maxAge: 1 * 60 * 1000,
//     });

//     req.writer = {
//       userId: user._id,
//       email: user.email,
//       role: user.role,
//     };

//     return next();
//   } catch (error) {
//     res.clearCookie("writerAccessToken");
//     res.clearCookie("writerRefreshToken");
//     return res.redirect("/writer/login");
//   }
// };

const writerAuthCheck = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ msg: "No token" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const writer = await WriterModel.findById(decoded.userId);

    if (!writer) {
      return res.status(401).json({ msg: "Writer not found" });
    }

    req.writer = writer; //always full object

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    return res.status(401).json({ msg: "Invalid token" });
  }
};
const verifyWriterApiKey = async (req, res, next) => {
  try {
    const apiKey = req.writer?.apiKey;

    if (!apiKey) {
      return res.status(401).json({ msg: "API key missing" });
    }

    const isMatch = await bcrypt.compare(
      process.env.WRITER_BLOG_API_SECRET_KEY,
      apiKey,
    );

    if (!isMatch) {
      return res.status(403).json({ msg: "Invalid API key" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};
module.exports = { writerAuthCheck, verifyWriterApiKey };
