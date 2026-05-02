const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UserModel = require("../models/user");
const BlogModel = require("../models/blog");
const CommentModel = require("../models/comments");

class userController {
  async userRegister(req, res) {
    try {
      const { userName, email, password } = req.body;
      const exists = await UserModel.findOne({ email });
      if (exists) {
        req.flash("error", "Email already registered");
        return res.redirect("/user/register-view");
      }

      const hashed = await bcrypt.hash(password, 10);
      await UserModel.create({
        userName,
        email,
        password: hashed,
      });
      req.flash("success", "Admin registered. Please login.");
      res.redirect("/user/login-view");
    } catch (err) {
      req.flash("error", err.message);
      res.redirect("/user/register-view");
    }
  }

  async userLogin(req, res) {
    try {
      const { email, password } = req.body;

      // 1. Validate
      if (!email || !password) {
        req.flash("error", "All input is required");
        return res.redirect("/user/login-view");
      }

      // 2. Find user
      const user = await UserModel.findOne({ email });

      if (!user || user.role !== "user") {
        req.flash("error", "Invalid email or password");
        return res.redirect("/user/login-view");
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/user/login-view");
      }

      // Tokens
      const userAccessToken = jwt.sign(
        {
          userId: user._id,
          userName: user.userName,
          email: user.email,
          isActive: user.isActive,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1m" },
      );

      const userRefreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET_KEY,
        { expiresIn: "7d" },
      );

      // Save refresh token
      user.refreshToken = userRefreshToken;
      await user.save();

      // Cookies
      res.cookie("userAccessToken", userAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 1 * 60 * 1000,
      });

      res.cookie("userRefreshToken", userRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      req.flash("success", "User logged in successfully");
      return res.redirect("/user/home");
    } catch (error) {
      console.error("Admin Login Error:", error);

      req.flash("error", "Something went wrong");
      return res.redirect("/user/login-view");
    }
  }

  // toggle like
  async toggleLikeBlog(req, res) {
    try {
      const { blogId } = req.params;
      const userId = req.user.userId;

      const blog = await BlogModel.findById(blogId);

      if (!blog) {
        req.flash("error", "No blog found");
        return res.redirect("/user/home");
      }

      const index = blog.likes.findIndex((id) => id.toString() === userId);

      if (index > -1) {
        //unlike
        blog.likes.splice(index, 1);
      } else {
        //like
        blog.likes.push(userId);
      }

      await blog.save();

      req.flash("success", "Blog Liked");
      return res.redirect(`/user/view-blog/${blogId}`);
    } catch (err) {
      console.error("LIKE ERROR:", err);

      req.flash("error", "Something went Wrong");
      return res.redirect("/user/home");
    }
  }

  async addComment(req, res) {
    try {
      const { blogId } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      console.log("USER", req.user);

      if (!content || content.trim() === "") {
        req.flash("error", "Comment cannot be empty");
        return res.redirect(`/user/view-blog/${blogId}`);
      }

      const blog = await BlogModel.findById(blogId);

      if (!blog) {
        req.flash("error", "Blog not found");
        return res.redirect(`/user/home`);
      }

      await CommentModel.create({
        blog: blogId,
        user: userId,
        content: content.trim(),
      });

      req.flash("success", "Comment added successfully");
      return res.redirect(`/user/view-blog/${blogId}`);
    } catch (err) {
      console.error("COMMENT ERROR:", err);

      req.flash("error", "Something went wrong while adding comment");
      return res.redirect(`/user/home`);
    }
  }

  async userPasswordUpdate(req, res) {
    try {
      console.log(req.user);
      const { currentPassword, newPassword } = req.body;

      //validate input
      if (!currentPassword || !newPassword) {
        req.flash("error", "all password field are required");
        return res.redirect("/user/profile");
      }

      if (newPassword.length < 6) {
        req.flash("error", "New password must be at least 6 characters");
        return res.redirect("/user/profile");
      }

      // 2. get admin from DB
      const user = await UserModel.findById(req.user.userId);

      if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/user/login-view");
      }

      // 3. compare current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        req.flash("error", "Current password is incorrect");
        return res.redirect("/user/profile");
      }

      // 4. hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 5. update password
      user.password = hashedPassword;
      await user.save();

      req.flash("success", "Password updated successfully");
      return res.redirect("/user/home");
    } catch (err) {
      req.flash("error", err.message);

      res.redirect("/user/profile");
    }
  }

  //logout
  async userLogout(req, res) {
    try {
      const refreshToken = req.cookies.userRefreshToken;

      console.log("TOKEN FROM COOKIE:", refreshToken);

      if (refreshToken) {
        const user = await UserModel.findOne({ refreshToken });

        console.log("USER FOUND:", user);

        if (user) {
          user.refreshToken = null;
          user.apiKey = null;
          await user.save();
          console.log("TOKENS CLEARED IN DB");
        }
      }

      res.clearCookie("userAccessToken");
      res.clearCookie("userRefreshToken");
      res.clearCookie("apiKey");

      req.flash("success", "Logged out Successfully");
      res.redirect("/user/login-view");
    } catch (error) {
      console.log("LOGOUT ERROR:", error.message);
      req.flash("error", error.message);
      res.redirect("/user/login-view");
    }
  }
}

module.exports = new userController();
