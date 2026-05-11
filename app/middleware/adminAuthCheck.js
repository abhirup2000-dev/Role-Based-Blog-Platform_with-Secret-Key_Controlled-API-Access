const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const AdminModel = require("../models/admin");

const adminAuthCheck = async (req, res, next) => {
  const accessToken = req.cookies?.adminAccessToken;
  const refreshToken = req.cookies?.adminRefreshToken;

  //  No tokens at all
  if (!accessToken && !refreshToken) {
    return res.redirect("/admin/login-view");
  }

  //  Try ACCESS TOKEN
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);

      req.admin = decoded;
      return next();
    } catch (err) {
      // expired → move to refresh
    }
  }

  //  Try REFRESH TOKEN
  if (!refreshToken) {
    return res.redirect("/admin/login-view");
  }

  try {
    const decodedRefresh = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET_KEY,
    );

    const user = await AdminModel.findById(decodedRefresh.userId);

    //  Token mismatch (VERY IMPORTANT SECURITY CHECK)
    if (!user || !bcrypt.compare(refreshToken, user.refreshToken)) {
      res.clearCookie("adminAccessToken");
      res.clearCookie("adminRefreshToken");
      res.clearCookie("apiKey");
      return res.redirect("/admin/login-view");
    }

    // Generate NEW access token
    const newAccessToken = jwt.sign(
      {
        adminName: user.adminName,
        userId: user._id,
        email: user.email,
        role: user.role,
        apiKey: user.apiKey,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1m" },
    );

    //  Set new access token
    res.cookie("adminAccessToken", newAccessToken, {
      httpOnly: true,
      maxAge: 1 * 60 * 1000,
    });

    req.admin = {
      adminName: user.adminName,
      userId: user._id,
      email: user.email,
      role: user.role,
      apiKey: user.apiKey,
    }; //pass user data to admin

    return next();
  } catch (error) {
    res.clearCookie("adminAccessToken");
    res.clearCookie("adminRefreshToken");
    res.clearCookie("apiKey");
    return res.redirect("/admin/login-view");
  }
};


//auto gen api(generate at login time saved in DB) key verification
const verifyAdminApiKey = async (req, res, next) => {
  try {
    const key = req.cookies.apiKey?.trim();

    if (!key) {
      req.flash("error", "API key required");
      return res.redirect("/admin/login-view");
    }

    if (!req.admin || !req.admin.userId) {
      req.flash("error", "Unauthorized access");
      return res.redirect("/admin/login-view");
    }

    const admin = await AdminModel.findById(req.admin.userId);

    if (!admin || !admin.apiKey) {
      req.flash("error", "Admin not found or API key missing");
      return res.redirect("/admin/login-view");
    }

    const isMatch = await bcrypt.compare(key, admin.apiKey);

    if (!isMatch) {
      req.flash("error", "Invalid API key");
      return res.redirect("/admin/login-view");
    }

    // attach fresh admin if needed
    req.admin = {
      adminName: user.adminName,
      userId: user._id,
      email: user.email,
      role: user.role,
      apiKey: user.apiKey,
    }; //pass user data to admin

    next();
  } catch (err) {
    console.error("API KEY VERIFY ERROR:", err.message);
    req.flash("error", "Something went wrong");
    return res.redirect("/admin/login-view");
  }
};

module.exports = { adminAuthCheck, verifyAdminApiKey };
