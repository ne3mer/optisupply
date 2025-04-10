const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const UserSchema = new Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "analyst", "viewer"],
      default: "viewer",
    },
    permissions: {
      suppliers: {
        view: {
          type: Boolean,
          default: true,
        },
        create: {
          type: Boolean,
          default: false,
        },
        edit: {
          type: Boolean,
          default: false,
        },
        delete: {
          type: Boolean,
          default: false,
        },
      },
      recommendations: {
        view: {
          type: Boolean,
          default: true,
        },
        create: {
          type: Boolean,
          default: false,
        },
        edit: {
          type: Boolean,
          default: false,
        },
        delete: {
          type: Boolean,
          default: false,
        },
      },
      reports: {
        view: {
          type: Boolean,
          default: true,
        },
        create: {
          type: Boolean,
          default: false,
        },
        edit: {
          type: Boolean,
          default: false,
        },
        delete: {
          type: Boolean,
          default: false,
        },
      },
    },
    profile: {
      job_title: {
        type: String,
      },
      department: {
        type: String,
      },
      avatar: {
        type: String,
      },
      phone: {
        type: String,
      },
      timezone: {
        type: String,
        default: "UTC",
      },
      bio: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "pending",
    },
    last_login: {
      type: Date,
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
      dashboard_layout: {
        type: Schema.Types.Mixed,
      },
    },
    reset_password_token: {
      type: String,
    },
    reset_password_expires: {
      type: Date,
    },
    verification_token: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Password hash middleware
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
UserSchema.virtual("full_name").get(function () {
  return `${this.first_name} ${this.last_name}`;
});

// Set permissions based on role
UserSchema.pre("save", function (next) {
  if (this.isModified("role")) {
    switch (this.role) {
      case "admin":
        this.permissions = {
          suppliers: { view: true, create: true, edit: true, delete: true },
          recommendations: {
            view: true,
            create: true,
            edit: true,
            delete: true,
          },
          reports: { view: true, create: true, edit: true, delete: true },
        };
        break;
      case "manager":
        this.permissions = {
          suppliers: { view: true, create: true, edit: true, delete: false },
          recommendations: {
            view: true,
            create: true,
            edit: true,
            delete: false,
          },
          reports: { view: true, create: true, edit: true, delete: false },
        };
        break;
      case "analyst":
        this.permissions = {
          suppliers: { view: true, create: true, edit: false, delete: false },
          recommendations: {
            view: true,
            create: true,
            edit: false,
            delete: false,
          },
          reports: { view: true, create: true, edit: false, delete: false },
        };
        break;
      case "viewer":
        this.permissions = {
          suppliers: { view: true, create: false, edit: false, delete: false },
          recommendations: {
            view: true,
            create: false,
            edit: false,
            delete: false,
          },
          reports: { view: true, create: false, edit: false, delete: false },
        };
        break;
    }
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
