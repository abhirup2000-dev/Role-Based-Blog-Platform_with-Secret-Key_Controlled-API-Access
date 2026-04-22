const jwt = require("jsonwebtoken");

const bcrypt = require("bcryptjs");

const AdminModel = require("../models/admin");
const WriterModel = require("../models/writer");
const BlogModel = require("../models/blog");

class adminController {
  async adminRegister(req, res) {
    try {
      const { adminName, email, password, phone } = req.body;
      const exists = await AdminModel.findOne({ email });
      if (exists) {
        // req.flash("error", "Email already registered");
        // return res.redirect("/admin/register");
        return res.status(401).json({
          success: false,
          message: "Email already registered",
        });
      }

      const hashed = await bcrypt.hash(password, 10);

      const hashedApiKey = await bcrypt.hash(
        process.env.ADMIN_BLOG_API_SECRET_KEY,
        10,
      );

      await AdminModel.create({
        adminName,
        email,
        password: hashed,
        phone,
        apiKey: hashedApiKey,
      });
      // req.flash("success", "Admin registered. Please login.");
      // res.redirect("/admin/login");
      return res.status(201).json({
        success: true,
        message: "admin created successfully",
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

  async adminLogin(req, res) {
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
      const user = await AdminModel.findOne({ email });

      if (!user || user.role !== "admin") {
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
      const adminAccessToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
          apiKey: user.apiKey,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "5m" },
      );

      const adminRefreshToken = jwt.sign(
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
        message: "Admin logged in successfully",
        admin: {
          userId: user._id,
          userName: user.adminName,
          role: user.role,
          phone: user.phone,
          apiKey: user.apiKey,
        },
        token: adminAccessToken,
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

  ///create writer
  async writerRegister(req, res) {
    try {
      const { writerName, email, password } = req.body;
      const exists = await WriterModel.findOne({ email });
      if (exists) {
        // req.flash("error", "Email already registered");
        // return res.redirect("/admin/register");
        return res.status(401).json({
          success: false,
          message: "Email already registered",
        });
      }

      const hashed = await bcrypt.hash(password, 10);

      const hashedApiKey = await bcrypt.hash(
        process.env.WRITER_BLOG_API_SECRET_KEY,
        10,
      );

      await WriterModel.create({
        writerName,
        email,
        password: hashed,
        apiKey: hashedApiKey,
      });
      // req.flash("success", "Admin registered. Please login.");
      // res.redirect("/admin/login");
      return res.status(201).json({
        success: true,
        message: "writer created successfully",
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

  ////blog(CRUD operations by admin)
  // async createBlog(req, res) {
  //   try {
  //     const { title, content, excerpt, category } = req.body;

  //     if (!title || !content) {
  //       return res.status(400).json({ msg: "Title & content required" });
  //     }

  //     if (!req.admin || !req.admin.userId) {
  //       return res.status(401).json({ msg: "Unauthorized" });
  //     }

  //     const blog = await BlogModel.create({
  //       title,
  //       content,
  //       excerpt,
  //       category,
  //       author: req.admin.userId,
  //       authorModel: "Admin",
  //       status: "draft",
  //     });

  //     return res.status(201).json({
  //       success: true,
  //       message: "blog created successfully",
  //       data: blog,
  //     });
  //   } catch (err) {
  //     console.error("CREATE BLOG ERROR:", err);

  //     return res.status(500).json({
  //       msg: "Create blog failed",
  //       error: err.message,
  //     });
  //   }
  // }

  // async getAllBlogs(req, res) {
  //   try {
  //     const blogs = await BlogModel.aggregate([
  //       // 🔗 join comments
  //       {
  //         $lookup: {
  //           from: "comments",
  //           localField: "_id",
  //           foreignField: "blog",
  //           as: "comments",
  //         },
  //       },

  //       // 🔗 join user inside each comment
  //       {
  //         $lookup: {
  //           from: "users",
  //           localField: "comments.user",
  //           foreignField: "_id",
  //           as: "commentUsers",
  //         },
  //       },

  //       // 🧠 map user into each comment
  //       {
  //         $addFields: {
  //           comments: {
  //             $map: {
  //               input: "$comments",
  //               as: "comment",
  //               in: {
  //                 _id: "$$comment._id",
  //                 content: "$$comment.content",
  //                 createdAt: "$$comment.createdAt",
  //                 user: {
  //                   $let: {
  //                     vars: {
  //                       matchedUser: {
  //                         $arrayElemAt: [
  //                           {
  //                             $filter: {
  //                               input: "$commentUsers",
  //                               as: "user",
  //                               cond: {
  //                                 $eq: ["$$user._id", "$$comment.user"],
  //                               },
  //                             },
  //                           },
  //                           0,
  //                         ],
  //                       },
  //                     },
  //                     in: {
  //                       _id: "$$matchedUser._id",
  //                       userName: "$$matchedUser.userName",
  //                       email: "$$matchedUser.email",
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },

  //       // 📊 counts
  //       {
  //         $addFields: {
  //           totalComments: { $size: "$comments" },
  //           totalLikes: { $size: "$likes" },
  //         },
  //       },

  //       // 🧹 optional cleanup
  //       {
  //         $project: {
  //           commentUsers: 0, // remove temp field
  //         },
  //       },

  //       {
  //         $sort: { createdAt: -1 },
  //       },
  //     ]);

  //     return res.status(200).json({
  //       success: true,
  //       count: blogs.length,
  //       data: blogs,
  //     });
  //   } catch (err) {
  //     console.error("AGGREGATE ERROR:", err);

  //     return res.status(500).json({
  //       success: false,
  //       message: err.message,
  //     });
  //   }
  // }

  // async updateBlog(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const { title, content, excerpt, category, status } = req.body;

  //     // find blog
  //     const blog = await BlogModel.findById(id);

  //     if (!blog) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Blog not found",
  //       });
  //     }

  //     //check ownership
  //     if (!req.admin || blog.author.toString() !== req.admin.userId) {
  //       return res.status(403).json({
  //         success: false,
  //         message: "Not allowed to update this blog",
  //       });
  //     }

  //     // update only provided fields
  //     if (title) blog.title = title;
  //     if (content) blog.content = content;
  //     if (excerpt) blog.excerpt = excerpt;
  //     if (category) blog.category = category;
  //     if (status) blog.status = status;

  //     await blog.save();

  //     return res.status(200).json({
  //       success: true,
  //       message: "Blog updated successfully",
  //       data: blog,
  //     });
  //   } catch (err) {
  //     console.error("UPDATE BLOG ERROR:", err);

  //     return res.status(500).json({
  //       success: false,
  //       message: err.message,
  //     });
  //   }
  // }

  // async deleteBlog(req, res) {
  //   try {
  //     const { id } = req.params;

  //     const blog = await BlogModel.findById(id);

  //     if (!blog) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Blog not found",
  //       });
  //     }

  //     //ownership check
  //     if (!req.admin || blog.author.toString() !== req.admin.userId) {
  //       return res.status(403).json({
  //         success: false,
  //         message: "Not allowed to delete this blog",
  //       });
  //     }

  //     await BlogModel.findByIdAndDelete(id);

  //     return res.status(200).json({
  //       success: true,
  //       message: "Blog deleted successfully",
  //     });
  //   } catch (err) {
  //     console.error("DELETE BLOG ERROR:", err);

  //     return res.status(500).json({
  //       success: false,
  //       message: err.message,
  //     });
  //   }
  // }

  ////all CRUD operations in one function
  async blogOperations(req, res) {
    try {
      const method = req.method;

      switch (method) {
        //GET → get all blogs
        case "GET": {
          const blogs = await BlogModel.aggregate([
            //join comments by users on blogs
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
                        email: "$user.email",
                      },
                    },
                  },
                ],
                as: "comments",
              },
            },

            //join author(admin or writer)
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
                      role: { $arrayElemAt: ["$writerAuthor.role", 0] },
                    },
                    else: {
                      _id: { $arrayElemAt: ["$adminAuthor._id", 0] },
                      name: { $arrayElemAt: ["$adminAuthor.adminName", 0] },
                      role: { $arrayElemAt: ["$adminAuthor.role", 0] },
                    },
                  },
                },

                totalComments: { $size: "$comments" },
                totalLikes: { $size: { $ifNull: ["$likes", []] } },
              },
            },
            {
              $project: {
                adminAuthor: 0,
                writerAuthor: 0,
              },
            },
            
            {
              $project: {
                authorInfo: 0,
              },
            },

            //sort
            { $sort: { createdAt: -1 } },
          ]);

          return res.status(200).json({
            success: true,
            count: blogs.length,
            data: blogs,
          });
        }

        //POST → create
        case "POST": {
          const { title, content, excerpt, category } = req.body;

          if (!title || !content) {
            return res.status(400).json({ msg: "Title & content required" });
          }

          if (!req.admin || !req.admin.userId) {
            return res.status(401).json({ msg: "Unauthorized" });
          }

          const blog = await BlogModel.create({
            title,
            content,
            excerpt,
            category,
            author: req.admin.userId,
            authorModel: "Admin",
            status: "draft",
          });

          return res.status(201).json({
            success: true,
            message: "Blog created successfully",
            data: blog,
          });
        }

        //PUT → update
        case "PUT": {
          const { id } = req.params;
          const { title, content, excerpt, category, status } = req.body;

          if (!id) {
            return res.status(400).json({ msg: "Blog ID required" });
          }

          const blog = await BlogModel.findById(id);

          if (!blog) {
            return res.status(404).json({ msg: "Blog not found" });
          }

          if (!req.admin || blog.author.toString() !== req.admin.userId) {
            return res.status(403).json({ msg: "Not allowed to update" });
          }

          if (title) blog.title = title;
          if (content) blog.content = content;
          if (excerpt) blog.excerpt = excerpt;
          if (category) blog.category = category;
          if (status) blog.status = status;

          await blog.save();

          return res.status(200).json({
            success: true,
            message: "Blog updated",
            data: blog,
          });
        }

        //DELETE → delete
        case "DELETE": {
          const { id } = req.params;

          if (!id) {
            return res.status(400).json({ msg: "Blog ID required" });
          }

          const blog = await BlogModel.findById(id);

          if (!blog) {
            return res.status(404).json({ msg: "Blog not found" });
          }

          if (!req.admin || blog.author.toString() !== req.admin.userId) {
            return res.status(403).json({ msg: "Not allowed to delete" });
          }

          await BlogModel.findByIdAndDelete(id);

          return res.status(200).json({
            success: true,
            message: "Blog deleted",
          });
        }

        default:
          return res.status(405).json({
            msg: `Method ${method} not allowed`,
          });
      }
    } catch (err) {
      console.error("BLOG OPS ERROR:", err);
      return res.status(500).json({
        msg: "Something went wrong",
        error: err.message,
      });
    }
  }

  async dashboard(req, res) {
    try {
      console.log("admin:", req.admin);
      return res.render("admin/dashboard");
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  async adminPasswordUpdate(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // 1. validate input
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

      // 2. get admin from DB
      const admin = await AdminModel.findById(req.admin.userId);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      // 3. compare current password
      const isMatch = await bcrypt.compare(currentPassword, admin.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // 4. hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 5. update password
      admin.password = hashedPassword;
      await admin.save();

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

  //blog approve and reject by admin
  async approveAndPublishBlog(req, res) {
    try {
      const { blogId } = req.params;

      if (!req.admin || !req.admin.userId) {
        return res.status(401).json({ msg: "Unauthorized" });
      }

      if (!blogId) {
        return res.status(400).json({ msg: "Blog ID is required" });
      }

      const blog = await BlogModel.findById(blogId);

      if (!blog) {
        return res.status(404).json({ msg: "Blog not found" });
      }

      // only writer blogs need approval
      if (blog.authorModel !== "Writer") {
        return res.status(400).json({
          msg: "Only writer blogs need approval",
        });
      }

      // prevent re-approval
      if (blog.status === "published") {
        return res.status(400).json({
          msg: "Blog is already published",
        });
      }

      // optional: handle rejected/draft → pending flow
      if (blog.status === "rejected") {
        return res.status(400).json({
          msg: "Rejected blogs cannot be published directly",
        });
      }

      blog.status = "published";
      blog.approvedBy = req.admin.userId;
      blog.publishedAt = new Date();

      await blog.save();

      return res.status(200).json({
        success: true,
        message: "Blog approved and published successfully",
        data: blog,
      });
    } catch (err) {
      console.error("APPROVAL ERROR:", err);
      return res.status(500).json({
        msg: "Failed to approve blog",
        error: err.message,
      });
    }
  }

  async rejectBlog(req, res) {
    try {
      const { blogId } = req.params;

      if (!req.admin || !req.admin.userId) {
        return res.status(401).json({ msg: "Unauthorized" });
      }

      const blog = await BlogModel.findById(blogId);

      if (!blog) {
        return res.status(404).json({ msg: "Blog not found" });
      }

      if (blog.authorModel !== "Writer") {
        return res.status(400).json({
          msg: "Only writer blogs can be rejected",
        });
      }

      if (blog.status === "published") {
        return res.status(400).json({
          msg: "Published blogs cannot be rejected",
        });
      }

      blog.status = "rejected";
      blog.approvedBy = req.admin.userId; // who rejected it

      await blog.save();

      return res.status(200).json({
        success: true,
        message: "Blog rejected successfully",
        data: blog,
      });
    } catch (err) {
      console.error("REJECT ERROR:", err);
      return res.status(500).json({
        msg: "Failed to reject blog",
        error: err.message,
      });
    }
  }

  //logout
  // async adminLogout(req, res) {
  //   try {
  //     const refreshToken = req.cookies.adminRefreshToken;

  //     if (refreshToken) {
  //       const admin = await Admin.findOne({ refreshToken });

  //       if (admin) {
  //         admin.refreshToken = null;
  //         await admin.save();
  //       }
  //     }

  //     res.clearCookie("adminAccessToken");

  //     res.clearCookie("adminRefreshToken");

  //     res.redirect("/admin/login");
  //   } catch (error) {
  //     console.error("Logout Error:", error);

  //     res.redirect("/admin/login");
  //   }
  // }

  ///blog managing
}

module.exports = new adminController();
