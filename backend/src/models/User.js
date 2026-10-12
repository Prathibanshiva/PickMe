const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: function () {
        return this.defaultRole !== "admin";
      },
      unique: true,
      sparse: true,
      trim: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", null],
      default: null,
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    defaultRole: {
      type: String,
      enum: ["passenger", "driver", "admin"],
      default: "passenger",
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);