const jwt = require("jsonwebtoken");

const bcrypt = require("bcryptjs");

const cloudinary = require("cloudinary").v2;

const AdminModel = require("../models/admin");
const WriterModel = require("../models/writer");
const BlogModel = require("../models/blog");

const passwordGen = require("../utils/passwordGen");
const transporter = require("../config/emailConfig");

//unique secret key generator use at the time of log in
const apiKeyGen = require("../utils/apiKeyGen");

class adminController {
  async adminRegister(req, res) {
    try {
      const { adminName, email, password, phone } = req.body;
      const exists = await AdminModel.findOne({ email });
      if (exists) {
        req.flash("error", "Email already registered");
        return res.redirect("/admin/register-view");
        // return res.status(401).json({
        //   success: false,
        //   message: "Email already registered",
        // });
      }

      const hashed = await bcrypt.hash(password, 10);

      await AdminModel.create({
        adminName,
        email,
        password: hashed,
        phone,
      });
      req.flash("success", "Admin registered. Please login.");
      res.redirect("/admin/login-view");
      // return res.status(201).json({
      //   success: true,
      //   message: "admin created successfully",
      //   apiKey: ADMIN_BLOG_API_SECRET_KEY,
      // });
    } catch (err) {
      req.flash("error", err.message);
      console.log(err);
      res.redirect("/admin/register-view");
      //   return res.status(500).json({
      //     success: false,
      //     message: err.message,
      //   });
    }
  }

  async adminLogin(req, res) {
    try {
      console.log("admin:", req.admin);
      const { email, password } = req.body;

      //Validate
      if (!email || !password) {
        req.flash("error", "All input is required");
        return res.redirect("/admin/login-view");
      }

      //Find user
      const user = await AdminModel.findOne({ email });

      if (!user || user.role !== "admin") {
        req.flash(
          "error",
          "unauthorized access, please make sure you are login as ADMIN",
        );
        return res.redirect("/admin/login-view");
      }

      //Compare password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        req.flash("error", "Invalid email or password");
        console.log("error", "Invalid email or password");
        return res.redirect("/admin/login-view");
      }

      // generate new key
      const newApiKey = apiKeyGen;

      // replace old key
      user.apiKey = await bcrypt.hash(newApiKey, 10);
      await user.save();

      // Tokens
      const adminAccessToken = jwt.sign(
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

      const adminRefreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET_KEY,
        { expiresIn: "7d" },
      );

      //Save refresh token
      user.refreshToken = adminRefreshToken;
      await user.save();

      //Cookies
      res.cookie("adminAccessToken", adminAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 1 * 60 * 1000,
      });

      res.cookie("adminRefreshToken", adminRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie("apiKey", newApiKey, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      req.flash("success", "Welcome to Admin Dashboard");

      return res.redirect("/admin/dashboard");
    } catch (error) {
      console.error("Admin Login Error:", error);

      req.flash("error", "Something went wrong");
      return res.redirect("/admin/login-view");
    }
  }

  ///create writer
  async writerRegister(req, res) {
    try {
      const { writerName, email } = req.body;
      const exists = await WriterModel.findOne({ email });
      if (exists) {
        req.flash("error", "Email already registered");
        return res.redirect("/admin/writers");
      }

      //random password generate
      const password = passwordGen();

      const hashed = await bcrypt.hash(password, 10);

      await WriterModel.create({
        writerName,
        email,
        password: hashed,
      });

      const baseUrl = req.protocol + "://" + req.get("host");
      const loginUrl = baseUrl + "/writer/login-view";

      //sending creentials to writer mail id
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Your Login Credentials",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Welcome Email</title>        </head>        <body style="margin:0;padding:0;background:#f5f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6fa;padding:32px 16px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e3e6f0;            ">

                <!-- HEADER -->
                <tr>
                  <td style="background:#0f1f3d;padding:32px 32px 28px;position:relative;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <table cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                            <tr>
                              <td style="background:rgba(55,138,221,0.2);border-radius:6px;width:28px;height:28px;text-align:center;            vertical-align:middle;">
                                <span style="font-size:14px;">&#128274;</span>
                              </td>
                              <td style="padding-left:8px;">
                                <span style="font-size:11px;color:#378add;letter-spacing:0.06em;font-weight:600;text-transform:uppercase;">Blog             Platform</span>
                              </td>
                            </tr>
                          </table>
                          <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Welcome aboard</p>
                          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);">Your account is live and ready to use</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- BODY -->
                <tr>
                  <td style="padding:28px 32px 0;">
                    <p style="margin:0 0 6px;font-size:14px;color:#6b7280;">Hello,</p>
                    <p style="margin:0 0 24px;font-size:14px;line-height:1.65;color:#6b7280;">
                      Your Blog Managing App account has been created. Use the credentials below to sign in for the first time.
                    </p>

                    <!-- CREDENTIALS CARD -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3e6f0;border-radius:10px;overflow:hidden;            margin-bottom:20px;">
                      <tr>
                        <td style="background:#f8f9fc;padding:10px 16px;border-bottom:1px solid #e3e6f0;">
                          <span style="font-size:11px;color:#9ca3af;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Login credentials</            span>
                        </td>
                      </tr>
                      <!-- Email row -->
                      <tr>
                        <td style="padding:14px 16px;border-bottom:1px solid #f1f3f9;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:#eff6ff;border-radius:6px;width:28px;height:28px;text-align:center;vertical-align:middle;            font-size:13px;">&#128140;</td>
                              <td style="padding-left:12px;">
                                <p style="margin:0;font-size:11px;color:#9ca3af;">Email address</p>
                                <p style="margin:0;font-size:13px;font-weight:600;color:#111827;font-family:'Courier New',monospace;">${email}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Password row -->
                      <tr>
                        <td style="padding:14px 16px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:#f0fdf4;border-radius:6px;width:28px;height:28px;text-align:center;vertical-align:middle;            font-size:13px;">&#128274;</td>
                              <td style="padding-left:12px;">
                                <p style="margin:0;font-size:11px;color:#9ca3af;">Temporary password</p>
                                <p style="margin:0;font-size:13px;font-weight:600;color:#111827;font-family:'Courier New',monospace;">${password}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- WARNING CALLOUT -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;            margin-bottom:24px;">
                      <tr>
                        <td style="padding:12px 14px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:top;padding-right:10px;font-size:15px;">&#9888;&#65039;</td>
                              <td>
                                <p style="margin:0;font-size:12px;line-height:1.6;color:#92400e;">
                                  Change your password immediately after first login. This temporary password will expire in <strong>24 hours</strong>.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA BUTTON -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}"
                              style="display:inline-block;background:#0f1f3d;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;            font-size:13px;font-weight:600;letter-spacing:0.02em;">
                            Sign in to your account
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="text-align:center;font-size:11px;color:#9ca3af;margin:0 0 4px;">or copy this link</p>
                    <p style="text-align:center;font-size:11px;color:#2563eb;margin:0 0 28px;font-family:'Courier New',monospace;word-break:break-all;            ">${loginUrl}</p>
                  </td>
                </tr>

                <!-- DIVIDER -->
                <tr>
                  <td style="padding:0 32px;">
                    <div style="height:1px;background:#f1f3f9;"></div>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="padding:18px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
                            Not expecting this email?<br>Contact your administrator.
                          </p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-size:11px;color:#9ca3af;text-align:right;line-height:1.6;">
                            &copy; 2026 EMS<br>All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
        </body>
        </html>`,
      });

      req.flash(
        "success",
        "Admin registered. Credentials send to respected email Id, Please login.",
      );
      res.redirect("/admin/writers");
    } catch (err) {
      req.flash("error", err.message);
      res.redirect("/admin/dashboard");
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

          return res.render("admin/blogs", {
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
            return res.redirect("/admin/dashboard/blogs");
          }

          if (!req.admin) {
            return res.redirect("/admin/login-view");
          }

          const admin = await AdminModel.findById(req.admin.userId);

          console.log(admin);

          await BlogModel.create({
            title,
            content,
            excerpt,
            category,
            author: admin._id,
            authorModel: "Admin",
            coverImage: req.file?.path,
            publicId: req.file?.filename,
          });

          req.flash("success", "Blog created successfully");
          return res.redirect("/admin/dashboard/blogs");
        }

        // ✅ PUT
        case "PUT": {
          const { id } = req.params;

          const blog = await BlogModel.findById(id);

          if (!blog) {
            req.flash("error", "Blog not found");
            return res.redirect("/admin/dashboard/blogs");
          }

          // OWNER CHECK (VERY IMPORTANT)
          if (blog.author.toString() !== req.admin.userId.toString()) {
            req.flash("error", "Unauthorized action");
            return res.redirect("/admin/dashboard/blogs");
          }

          // Only allow specific fields (avoid overwriting sensitive data)
          const { title, content, excerpt, category } = req.body;

          if (title) blog.title = title;
          if (content) blog.content = content;
          if (excerpt) blog.excerpt = excerpt;
          if (category) blog.category = category;

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
              return res.redirect("/admin/dashboard/blogs");
            }
          }

          await blog.save();

          req.flash("success", "Blog updated successfully");
          return res.redirect("/admin/dashboard/blogs");
        }

        // ✅ DELETE
        case "DELETE": {
          const { id } = req.params;
          const blog = await BlogModel.findById(id);

          if (!blog) {
            req.flash("error", "Blog not found");
            return res.redirect("/admin/dashboard/blogs");
          }

          if (blog.publicId) {
            await cloudinary.uploader.destroy(blog.publicId);
          }

          await BlogModel.findByIdAndDelete(id);

          req.flash("success", "Blog deleted");
          return res.redirect("/admin/dashboard/blogs");
        }

        default:
          return res.status(405).send("Method not allowed");
      }
    } catch (err) {
      console.log("BLOG ERROR FULL:", err);
      console.log("MESSAGE:", err.message);
      console.log("STACK:", err.stack);

      req.flash("error", err.message || "Something went wrong");
      return res.redirect("/admin/dashboard/blogs");
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
      console.log(req.admin);
      const { currentPassword, newPassword } = req.body;

      //validate input
      if (!currentPassword || !newPassword) {
        req.flash("error", "all password field are required");
        return res.redirect("/admin/profile");
      }

      if (newPassword.length < 6) {
        req.flash("error", "New password must be at least 6 characters");
        return res.redirect("/admin/profile");
      }

      // 2. get admin from DB
      const admin = await AdminModel.findById(req.admin.userId);

      if (!admin) {
        req.flash("error", "Admin not found");
        res.clearCookie("adminAccessToken");
        res.clearCookie("adminRefreshToken");
        res.clearCookie("apiKey");
        return res.redirect("/admin/login-view");
      }

      // 3. compare current password
      const isMatch = await bcrypt.compare(currentPassword, admin.password);

      if (!isMatch) {
        req.flash("error", "Current password is incorrect");
        return res.redirect("/admin/profile");
      }

      // 4. hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 5. update password
      admin.password = hashedPassword;
      await admin.save();

      req.flash("success", "Password updated successfully");
      return res.redirect("/admin/dashboard");
    } catch (err) {
      req.flash("error", err.message);

      res.redirect("/admin/profile");
    }
  }

  // toggle active/inactive
  async toggleWriterStatus(req, res) {
    try {
      const writer = await WriterModel.findById(req.params.id);

      if (!writer) {
        req.flash("error", "Writer not found");
        return res.redirect("/admin/writers");
      }

      writer.isActive = !writer.isActive;
      await writer.save();

      req.flash("success", "Writer status updated");
      return res.redirect("/admin/writers");
    } catch (error) {
      req.flash("error", "Something went wrong");
      return res.redirect("/admin/writers");
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

      req.flash("success", "Blog approved");

      return res.redirect("/admin/dashboard/blogs");
    } catch (err) {
      req.flash("error", err.message);
      return res.status(500).json({
        msg: "Failed to reject blog",
        error: err.message,
      });
    }
  }

  //logout
  async adminLogout(req, res) {
    try {
      const refreshToken = req.cookies.adminRefreshToken;

      console.log("TOKEN FROM COOKIE:", refreshToken);

      if (refreshToken) {
        const admin = await AdminModel.findOne({ refreshToken });

        console.log("ADMIN FOUND:", admin);

        if (admin) {
          admin.refreshToken = null;
          admin.apiKey = null;
          await admin.save();
          console.log("TOKENS CLEARED IN DB");
        }
      }

      res.clearCookie("adminAccessToken");
      res.clearCookie("adminRefreshToken");
      res.clearCookie("apiKey");

      req.flash("success", "Logged out Successfully");
      res.redirect("/admin/login-view");
    } catch (error) {
      console.log("LOGOUT ERROR:", error);
      req.flash("error", error.message);
      res.redirect("/admin/login-view");
    }
  }
}

module.exports = new adminController();
