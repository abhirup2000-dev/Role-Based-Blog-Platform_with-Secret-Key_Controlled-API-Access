const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const WriterModel = require("../models/writer");
const BlogModel = require("../models/blog");
const apiKeyGen = require("../utils/apiKeyGen");
const cloudinary = require("cloudinary").v2;

class writerController {
  async writerLogin(req, res) {
    try {
      const { email, password } = req.body;

      //Validate
      if (!email || !password) {
        req.flash("error", "All input is required");
        return res.redirect("/writer/login-view");

        // return res.status(400).json({
        //   success: false,
        //   message: "All input is required",
        // });
      }

      //Find user
      const user = await WriterModel.findOne({ email });

      if (!user || user.role !== "writer") {
        req.flash(
          "error",
          "unauthorized access, please make sure you are login as WRITER",
        );
        return res.redirect("/writer/login-view");

        // return res.status(401).json({
        //   success: false,
        //   message: "Invalid credentials",
        // });
      }

      if (user.isActive === false) {
        req.flash("error", "user not active contact admin");
        return res.redirect("/writer/login-view");
      }

      //Compare password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/writer/login-view");

        // return res.status(401).json({
        //   success: false,
        //   message: "Invalid credentials",
        // });
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
        { expiresIn: "1m" },
      );

      const writerRefreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET_KEY,
        { expiresIn: "7d" },
      );

      // 5. Save refresh token
      user.refreshToken = writerRefreshToken;
      await user.save();

      // 6. Cookies
      res.cookie("writerAccessToken", writerAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 1 * 60 * 1000,
      });

      res.cookie("writerRefreshToken", writerRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      req.flash("success", "Writer logged in successfully");
      return res.redirect("/writer/dashboard");

      console.log(req.writer);
      // return res.status(200).json({
      //   success: true,
      //   message: "Writer logged in successfully",
      //   writer: {
      //     userId: user._id,
      //     userName: user.adminName,
      //     role: user.role,
      //     phone: user.phone,
      //     apiKey: newApiKey,
      //   },
      //   token: writerAccessToken,
      // });
    } catch (error) {
      console.error("Writer Login Error:", error);

      req.flash("error", "Something went wrong");
      return res.redirect("/writer/login-view");

      // return res.status(500).json({
      //   success: false,
      //   message: "Server error",
      // });
    }
  }

  //CRUD operations by one endpoint and one function(using switch case)
  // async blogsHandler(req, res) {
  //   try {
  //     switch (req.method) {
  //       case "GET": {
  //         const blogs = await BlogModel.find().sort({ createdAt: -1 });
  //         return res.status(200).json({
  //           success: true,
  //           message: "All blogs fetched",
  //           data: blogs,
  //         });
  //       }

  //       case "POST": {
  //         const { title, content, excerpt, category } = req.body;

  //         if (!title || !content || !excerpt || !category) {
  //           return res.status(400).json({ msg: "all fields are required" });
  //         }

  //         const blog = await BlogModel.create({
  //           title,
  //           content,
  //           excerpt,
  //           category,
  //           author: req.writer._id,
  //           authorModel: "Writer",
  //         });

  //         return res.status(201).json({ success: true, data: blog });
  //       }

  //       case "PUT": {
  //         // UPDATE BLOG
  //         const { blogId } = req.params;
  //         const { title, content, excerpt, category } = req.body;

  //         if (!blogId) {
  //           return res.status(400).json({ msg: "Blog ID required" });
  //         }

  //         const existing = await BlogModel.findById(blogId);

  //         if (!existing) {
  //           return res.status(404).json({ msg: "Blog not found" });
  //         }

  //         if (!existing.author.equals(req.writer._id)) {
  //           return res.status(403).json({ msg: "Not authorized" });
  //         }

  //         if (title !== undefined) existing.title = title;
  //         if (content !== undefined) existing.content = content;
  //         if (excerpt !== undefined) existing.excerpt = excerpt;
  //         if (category !== undefined) existing.category = category;

  //         await existing.save();

  //         return res.status(200).json({
  //           success: true,
  //           msg: "Blog updated",
  //           data: existing,
  //         });
  //       }

  //       case "DELETE": {
  //         const { blogId } = req.params;

  //         const blogToDelete = await BlogModel.findById(blogId);

  //         if (!blogToDelete) {
  //           return res.status(404).json({ msg: "Blog not found" });
  //         }

  //         if (!blogToDelete.author.equals(req.writer._id)) {
  //           return res.status(403).json({ msg: "Not authorized" });
  //         }

  //         await blogToDelete.deleteOne();

  //         return res.status(200).json({ success: true, msg: "Deleted" });
  //       }

  //       default:
  //         return res.status(405).json({ msg: "Method not allowed" });
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     return res.status(500).json({ msg: "Server error" });
  //   }
  // }

  async blogHandlers(req, res) {
    try {
      const method = req.method;

      switch (method) {
        // ✅ GET
        case "GET": {
          const blogs = await BlogModel.aggregate([
            {
              $lookup: {
                from: "comments",
                let: { blogId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$blog", "$$blogId"] },
                    },
                  },
                  {
                    $lookup: {
                      from: "users",
                      localField: "user",
                      foreignField: "_id",
                      as: "user",
                    },
                  },
                  {
                    $unwind: {
                      path: "$user",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $project: {
                      content: 1,
                      createdAt: 1,
                      user: {
                        _id: "$user._id",
                        userName: "$user.userName",
                      },
                    },
                  },
                ],
                as: "comments",
              },
            },
            {
              $lookup: {
                from: "admins",
                localField: "author",
                foreignField: "_id",
                as: "adminAuthor",
              },
            },
            {
              $lookup: {
                from: "writers",
                localField: "author",
                foreignField: "_id",
                as: "writerAuthor",
              },
            },
            {
              $addFields: {
                author: {
                  $cond: {
                    if: { $eq: ["$authorModel", "Writer"] },
                    then: {
                      _id: { $arrayElemAt: ["$writerAuthor._id", 0] },
                      name: { $arrayElemAt: ["$writerAuthor.writerName", 0] },
                    },
                    else: {
                      _id: { $arrayElemAt: ["$adminAuthor._id", 0] },
                      name: { $arrayElemAt: ["$adminAuthor.adminName", 0] },
                    },
                  },
                },
                totalComments: { $size: "$comments" },
                totalLikes: { $size: { $ifNull: ["$likes", []] } },
              },
            },
            { $project: { adminAuthor: 0, writerAuthor: 0 } },
            { $sort: { createdAt: -1 } },
          ]);

          return res.render("writer/blogs", {
            title: "Blogs",
            blogs,
            success: req.flash("success"),
            error: req.flash("error"),
          });
        }

        // ✅ POST
        case "POST": {
          const { title, content, excerpt, category } = req.body;

          if (!title || !content || !excerpt || !category) {
            req.flash("error", "All fields are required");
            return res.redirect("/writer/blogs");
          }

          if (!req.writer?.userId) {
            return res.redirect("/writer/login-view");
          }

          const writer = await WriterModel.findById(req.writer.userId);

          if (!writer) {
            req.flash("error", "Writer not found");
            return res.redirect("/writer/blogs");
          }

          await BlogModel.create({
            title,
            content,
            excerpt,
            category,
            author: writer._id,
            authorModel: "Writer",
            coverImage: req.file?.path,
            publicId: req.file?.filename,
          });

          req.flash("success", "Blog created successfully");
          return res.redirect("/writer/blogs");
        }

        // ✅ PUT
        case "PUT": {
          const { blogId } = req.params;

          console.log("BODY:", req.body);

          if (!req.writer?.userId) {
            return res.redirect("/writer/login-view");
          }

          const blog = await BlogModel.findById(blogId);

          if (!blog) {
            req.flash("error", "Blog not found");
            return res.redirect("/writer/blogs");
          }

          if (blog.author.toString() !== req.writer.userId.toString()) {
            req.flash("error", "Unauthorized action");
            return res.redirect("/writer/blogs");
          }

          const { title, content, excerpt, category } = req.body;

          blog.title = req.body.title;
          blog.content = req.body.content;
          blog.excerpt = req.body.excerpt;
          blog.category = req.body.category;

          // Handle image update
          if (req.file) {
            try {
              if (blog.publicId) {
                await cloudinary.uploader.destroy(blog.publicId);
              }

              blog.coverImage = req.file.path;
              blog.publicId = req.file.filename;
            } catch (err) {
              console.log("Cloudinary error:", err.message);
              req.flash("error", "Image upload failed");
              return res.redirect("/writer/blogs");
            }
          }


          await blog.save();

          console.log("UPDATED BLOG:", blog);

          req.flash("success", "Blog updated successfully");
          return res.redirect("/writer/blogs");
        }

        // ✅ DELETE
        case "DELETE": {
          const { blogId } = req.params;

          if (!req.writer?.userId) {
            return res.redirect("/writer/login-view");
          }

          const blog = await BlogModel.findById(blogId);

          if (!blog) {
            req.flash("error", "Blog not found");
            return res.redirect("/writer/blogs");
          }

          if (blog.author.toString() !== req.writer.userId.toString()) {
            req.flash("error", "Unauthorized action");
            return res.redirect("/writer/blogs");
          }

          if (blog.publicId) {
            await cloudinary.uploader.destroy(blog.publicId);
          }

          // ✅ FIXED HERE
          await BlogModel.findByIdAndDelete(blogId);

          req.flash("success", "Blog deleted");
          return res.redirect("/writer/blogs");
        }

        default:
          return res.status(405).send("Method not allowed");
      }
    } catch (err) {
      console.log("BLOG ERROR FULL:", err);
      req.flash("error", err.message || "Something went wrong");
      return res.redirect("/writer/blogs");
    }
  }
  async WriterPasswordUpdate(req, res) {
    try {
      console.log(req.writer);
      const { currentPassword, newPassword } = req.body;

      //validate input
      if (!currentPassword || !newPassword) {
        req.flash("error", "all password field are required");
        return res.redirect("/writer/profile");
      }

      if (newPassword.length < 6) {
        req.flash("error", "New password must be at least 6 characters");
        return res.redirect("/writer/profile");
      }

      // 2. get admin from DB
      const writer = await WriterModel.findById(req.writer.userId);

      if (!writer) {
        req.flash("error", "writer not found");
        return res.redirect("/writer/login-view");
      }

      // 3. compare current password
      const isMatch = await bcrypt.compare(currentPassword, writer.password);

      if (!isMatch) {
        req.flash("error", "Current password is incorrect");
        return res.redirect("/writer/profile");
      }

      // 4. hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 5. update password
      writer.password = hashedPassword;
      await writer.save();

      req.flash("success", "Password updated successfully");
      return res.redirect("/writer/dashboard");
    } catch (err) {
      req.flash("error", err.message);

      res.redirect("/writer/profile");
    }
  }

  //logout
  async writerLogout(req, res) {
    try {
      const refreshToken = req.cookies.writerRefreshToken;

      console.log("TOKEN FROM COOKIE:", refreshToken);

      if (refreshToken) {
        const writer = await WriterModel.findOne({ refreshToken });

        console.log("USER FOUND:", writer);

        if (writer) {
          writer.refreshToken = null;
          writer.apiKey = null;
          await writer.save();
          console.log("TOKENS CLEARED IN DB");
        }
      }

      res.clearCookie("writerAccessToken");
      res.clearCookie("writerRefreshToken");
      res.clearCookie("apiKey");

      req.flash("success", "Logged out Successfully");
      res.redirect("/writer/login-view");
    } catch (error) {
      console.log("LOGOUT ERROR:", error.message);
      req.flash("error", error.message);
      res.redirect("/writer/login-view");
    }
  }
}

module.exports = new writerController();
