const WriterModel = require("../models/writer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const WriterAuthCheck = async (req, res, next) => {
  const accessToken = req.cookies?.writerAccessToken;
  const refreshToken = req.cookies?.writerRefreshToken;

  //  No tokens at all
  if (!accessToken && !refreshToken) {
    return res.redirect("/writer/login-view");
  }

  //  Try ACCESS TOKEN
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);

      req.writer = decoded;
      return next();
    } catch (err) {
      // expired → move to refresh
    }
  }

  //  Try REFRESH TOKEN
  if (!refreshToken) {
    return res.redirect("/writer/login-view");
  }

  try {
    const decodedRefresh = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET_KEY,
    );

    const user = await WriterModel.findById(decodedRefresh.userId);

    //  Token mismatch (VERY IMPORTANT SECURITY CHECK)
    if (!user || user.refreshToken !== refreshToken) {
      res.clearCookie("writerAccessToken");
      res.clearCookie("writerRefreshToken");
      res.clearCookie("apiKey");
      return res.redirect("/writer/login-view");
    }

    // Generate NEW access token
    const newAccessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1m" },
    );

    //  Set new access token
    res.cookie("writerAccessToken", newAccessToken, {
      httpOnly: true,
      maxAge: 1 * 60 * 1000,
    });

    req.writer = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    res.clearCookie("writerAccessToken");
    res.clearCookie("writerRefreshToken");
    res.clearCookie("apiKey");
    return res.redirect("/writer/login-view");
  }
};

module.exports = WriterAuthCheck;
