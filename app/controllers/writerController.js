const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const WriterModel = require("../models/writer");
const BlogModel = require("../models/blog");
const apiKeyGen = require("../utils/apiKeyGen");

class writerController {
  async writerLogin(req, res) {
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
      const user = await WriterModel.findOne({ email });

      if (!user || user.role !== "writer") {
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

      //generate new key
      const newApiKey = apiKeyGen;

      // replace old key
      user.apiKey = await bcrypt.hash(newApiKey, 10);
      await user.save();

      //Tokens
      const writerAccessToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "15m" },
      );

      // const writerRefreshToken = jwt.sign(
      //   { userId: user._id },
      //   process.env.JWT_REFRESH_SECRET_KEY,
      //   { expiresIn: "7d" },
      // );

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

      console.log(req.writer);
      return res.status(200).json({
        success: true,
        message: "Writer logged in successfully",
        writer: {
          userId: user._id,
          userName: user.adminName,
          role: user.role,
          phone: user.phone,
          apiKey: newApiKey,
        },
        token: writerAccessToken,
      });
    } catch (error) {
      console.error("Writer Login Error:", error);

      // req.flash("error", "Something went wrong");
      // return res.redirect("/admin/login");

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }

  //CRUD operations by one endpoint and one function(using switch case)
  async blogsHandler(req, res) {
    try {
      switch (req.method) {
        case "GET": {
          const blogs = await BlogModel.find().sort({ createdAt: -1 });
          return res.status(200).json({
            success: true,
            message: "All blogs fetched",
            data: blogs,
          });
        }

        case "POST": {
          const { title, content, excerpt, category } = req.body;

          if (!title || !content || !excerpt || !category) {
            return res.status(400).json({ msg: "all fields are required" });
          }

          const blog = await BlogModel.create({
            title,
            content,
            excerpt,
            category,
            author: req.writer._id,
            authorModel: "Writer",
          });

          return res.status(201).json({ success: true, data: blog });
        }

        case "PUT": {
          // UPDATE BLOG
          const { blogId } = req.params;
          const { title, content, excerpt, category } = req.body;

          if (!blogId) {
            return res.status(400).json({ msg: "Blog ID required" });
          }

          const existing = await BlogModel.findById(blogId);

          if (!existing) {
            return res.status(404).json({ msg: "Blog not found" });
          }

          if (!existing.author.equals(req.writer._id)) {
            return res.status(403).json({ msg: "Not authorized" });
          }

          if (title !== undefined) existing.title = title;
          if (content !== undefined) existing.content = content;
          if (excerpt !== undefined) existing.excerpt = excerpt;
          if (category !== undefined) existing.category = category;

          await existing.save();

          return res.status(200).json({
            success: true,
            msg: "Blog updated",
            data: existing,
          });
        }

        case "DELETE": {
          const { blogId } = req.params;

          const blogToDelete = await BlogModel.findById(blogId);

          if (!blogToDelete) {
            return res.status(404).json({ msg: "Blog not found" });
          }

          if (!blogToDelete.author.equals(req.writer._id)) {
            return res.status(403).json({ msg: "Not authorized" });
          }

          await blogToDelete.deleteOne();

          return res.status(200).json({ success: true, msg: "Deleted" });
        }

        default:
          return res.status(405).json({ msg: "Method not allowed" });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error" });
    }
  }

  async writerPasswordUpdate(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      //validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters",
        });
      }

      // get writer from DB
      const writer = await WriterModel.findById(req.writer._id);

      if (!writer) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      //compare current password
      const isMatch = await bcrypt.compare(currentPassword, writer.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // update password
      writer.password = hashedPassword;
      await writer.save();

      return res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (err) {
      console.error("PASSWORD UPDATE ERROR:", err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = new writerController();
