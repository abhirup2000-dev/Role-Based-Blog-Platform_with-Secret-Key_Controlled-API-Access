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
        // req.flash("error", "Email already registered");
        // return res.redirect("/admin/register");
        return res.status(401).json({
          success: false,
          message: "Email already registered",
        });
      }

      const hashed = await bcrypt.hash(password, 10);
      await UserModel.create({
        userName,
        email,
        password: hashed,
      });
      // req.flash("success", "Admin registered. Please login.");
      // res.redirect("/admin/login");
      return res.status(201).json({
        success: true,
        message: "user created successfully",
      });
    } catch (err) {
      // req.flash("error", err.message);
      // res.redirect("/admin/register");
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  async userLogin(req, res) {
    try {
      const { email, password } = req.body;

      // 1. Validate
      if (!email || !password) {
        // req.flash("error", "All input is required");
        // return res.redirect("/admin/login");

        return res.status(400).json({
          success: false,
          message: "All input is required",
        });
      }

      // 2. Find user
      const user = await UserModel.findOne({ email });

      if (!user || user.role !== "user") {
        // req.flash("error", "Invalid email or password");
        // return res.redirect("/admin/login");

        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // 3. Compare password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        // req.flash("error", "Invalid email or password");
        // return res.redirect("/admin/login");

        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // 4. Tokens
      const userAccessToken = jwt.sign(
        {
          userId: user._id,
          userName: user.userName,
          email: user.email,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "5m" },
      );

      const userRefreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET_KEY,
        { expiresIn: "7d" },
      );

      // // 5. Save refresh token
      // user.refreshToken = refreshToken;
      // await user.save();

      // // 6. Cookies
      // res.cookie("adminAccessToken", accessToken, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      //   sameSite: "Strict",
      //   maxAge: 1 * 60 * 1000,
      // });

      // res.cookie("adminRefreshToken", refreshToken, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      //   sameSite: "Strict",
      //   maxAge: 7 * 24 * 60 * 60 * 1000,
      // });

      // req.flash("success", "Admin logged in successfully");
      // return res.redirect("/admin/dashboard");

      return res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user: {
          userId: user._id,
          userName: user.userName,
          role: user.role,
        },
        token: userAccessToken,
      });
    } catch (error) {
      console.error("Admin Login Error:", error);

      // req.flash("error", "Something went wrong");
      // return res.redirect("/admin/login");

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  // toggle like
  async toggleLikeBlog(req, res) {
    try {
      const { blogId } = req.params;
      const userId = req.user.userId;

      const blog = await BlogModel.findById(blogId);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
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

      return res.status(200).json({
        success: true,
        message: index > -1 ? "Blog unliked" : "Blog liked",
        totalLikes: blog.likes.length,
      });
    } catch (err) {
      console.error("LIKE ERROR:", err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  async addComment(req, res) {
    try {
      const { blogId } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: "Comment content required",
        });
      }

      const blog = await BlogModel.findById(blogId);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      const comment = await CommentModel.create({
        blog: blogId,
        user: userId,
        content,
      });

      return res.status(201).json({
        success: true,
        message: "Comment added",
        data: comment,
      });
    } catch (err) {
      console.error("COMMENT ERROR:", err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = new userController();
