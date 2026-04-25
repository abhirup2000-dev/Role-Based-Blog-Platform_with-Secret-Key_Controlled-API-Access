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

  //Get all blogs (only this writer)(for individual routes)
  // async getallBlogs(req, res) {
  //   try {
  //     const blogs = await BlogModel.aggregate([
  //       //join comments by users on blogs
  //       {
  //         $lookup: {
  //           from: "comments",
  //           let: { blogId: "$_id" },
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: { $eq: ["$blog", "$$blogId"] },
  //               },
  //             },
  //             {
  //               $lookup: {
  //                 from: "users",
  //                 localField: "user",
  //                 foreignField: "_id",
  //                 as: "user",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$user",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },
  //             {
  //               $project: {
  //                 content: 1,
  //                 createdAt: 1,
  //                 user: {
  //                   _id: "$user._id",
  //                   userName: "$user.userName",
  //                   email: "$user.email",
  //                 },
  //               },
  //             },
  //           ],
  //           as: "comments",
  //         },
  //       },

  //       //join author(admin or writer)
  //       {
  //         $lookup: {
  //           from: "admins",
  //           localField: "author",
  //           foreignField: "_id",
  //           as: "adminAuthor",
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: "writers",
  //           localField: "author",
  //           foreignField: "_id",
  //           as: "writerAuthor",
  //         },
  //       },
  //       {
  //         $addFields: {
  //           author: {
  //             $cond: {
  //               if: { $eq: ["$authorModel", "Writer"] },
  //               then: {
  //                 _id: { $arrayElemAt: ["$writerAuthor._id", 0] },
  //                 name: { $arrayElemAt: ["$writerAuthor.writerName", 0] },
  //                 role: { $arrayElemAt: ["$writerAuthor.role", 0] },
  //               },
  //               else: {
  //                 _id: { $arrayElemAt: ["$adminAuthor._id", 0] },
  //                 name: { $arrayElemAt: ["$adminAuthor.adminName", 0] },
  //                 role: { $arrayElemAt: ["$adminAuthor.role", 0] },
  //               },
  //             },
  //           },

  //           totalComments: { $size: "$comments" },
  //           totalLikes: { $size: { $ifNull: ["$likes", []] } },
  //         },
  //       },
  //       {
  //         $project: {
  //           adminAuthor: 0,
  //           writerAuthor: 0,
  //         },
  //       },

  //       {
  //         $project: {
  //           authorInfo: 0,
  //         },
  //       },

  //       //sort
  //       { $sort: { createdAt: -1 } },
  //     ]);

  //     res.status(200).json({
  //       success: true,
  //       count: blogs.length,
  //       data: blogs,
  //     });
  //   } catch (err) {
  //     res.status(500).json({ msg: "Failed to fetch blogs" });
  //   }
  // }
  // async getMyBlogs(req, res) {
  //   try {
  //     const blogs = await BlogModel.find({ author: req.writer.userId });

  //     res.status(200).json({
  //       success: true,
  //       count: blogs.length,
  //       data: blogs,
  //     });
  //   } catch (err) {
  //     res.status(500).json({ msg: "Failed to fetch blogs" });
  //   }
  // }

  // //Create blog
  // async createBlog(req, res) {
  //   try {
  //     const { title, content, excerpt, category } = req.body;

  //     if (!title || !content) {
  //       return res.status(400).json({ msg: "Title & content required" });
  //     }

  //     const blog = await BlogModel.create({
  //       title,
  //       content,
  //       excerpt,
  //       category,
  //       author: req.writer._id,
  //       authorModel: "Writer",
  //     });

  //     res.status(201).json({
  //       success: true,
  //       data: blog,
  //     });
  //   } catch (err) {
  //     console.log(err);
  //     res.status(500).json({ msg: "Failed to create blog" });
  //   }
  // }

  // //Update blog (only own)
  // async updateBlog(req, res) {
  //   try {
  //     const blog = await BlogModel.findById(req.params.id);

  //     if (!blog) {
  //       return res.status(404).json({ msg: "Blog not found" });
  //     }

  //     if (blog.author.toString() !== req.writer._id.toString()) {
  //       return res.status(403).json({ msg: "Not authorized" });
  //     }

  //     const updatedBlog = await BlogModel.findByIdAndUpdate(
  //       req.params.id,
  //       req.body,
  //       { new: true, runValidators: true },
  //     );

  //     res.status(200).json({
  //       success: true,
  //       data: updatedBlog,
  //     });
  //   } catch (err) {
  //     console.log(err);
  //     res.status(500).json({ msg: "Failed to update blog" });
  //   }
  // }

  // //Delete blog (only own)
  // async deleteBlog(req, res) {
  //   try {
  //     const { id } = req.params;

  //     if (!id) {
  //       return res.status(400).json({ msg: "Blog ID required" });
  //     }

  //     if (!req.writer || !req.writer._id) {
  //       return res.status(403).json({ msg: "Writer access required" });
  //     }

  //     const blog = await BlogModel.findById(id);

  //     if (!blog) {
  //       return res.status(404).json({ msg: "Blog not found" });
  //     }

  //     //proper comparison
  //     if (blog.author.toString() !== req.writer._id.toString()) {
  //       return res.status(403).json({ msg: "Not authorized" });
  //     }

  //     await BlogModel.findByIdAndDelete(id); // cleaner

  //     return res.status(200).json({
  //       success: true,
  //       msg: "Blog deleted",
  //     });
  //   } catch (err) {
  //     console.error("DELETE BLOG ERROR:", err);
  //     return res.status(500).json({ msg: "Failed to delete blog" });
  //   }
  // }

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
          const { title, content } = req.body;

          if (!title || !content) {
            return res.status(400).json({ msg: "Title & content required" });
          }

          const blog = await BlogModel.create({
            title,
            content,
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
}



module.exports = new writerController();
