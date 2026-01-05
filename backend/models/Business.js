const mongoose = require("mongoose");
const { workingHoursSchema } = require("./schemas/workingHours");

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tagline: {
      type: String,
      maxlength: [100, "Tagline cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    subcategory: String,
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      lowercase: true,
    },
    contactPhone: String,
    contactCountryCode: String,
    website: {
      type: String,
      match: [/^https?:\/\/.+/, "Please provide a valid URL"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      fullAddress: String,
      landmark: String,
      instructions: String,
    },
    logo: String,
    coverPhoto: String,
    photos: [
      {
        url: String,
        caption: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    verification: {
      status: {
        type: String,
        enum: ["unverified", "pending", "verified"],
        default: "unverified",
      },
      document: {
        type: {
          type: String,
          enum: ["aadhaar", "pan"],
        },
        fileUrl: String,
        fileFormat: {
          type: String,
          enum: ["image", "pdf"],
        },
        uploadedAt: Date,
      },
      submittedAt: Date,
      verifiedAt: Date,
    },
    workingHours: {
      monday: workingHoursSchema,
      tuesday: workingHoursSchema,
      wednesday: workingHoursSchema,
      thursday: workingHoursSchema,
      friday: workingHoursSchema,
      saturday: workingHoursSchema,
      sunday: workingHoursSchema,
    },
    holidays: [
      {
        date: Date,
        reason: String,
        isRecurring: {
          type: Boolean,
          default: false,
        },
      },
    ],
    timeZone: {
      type: String,
      default: "UTC",
    },
    currency: {
      type: String,
      default: "USD",
    },
    bookingSettings: {
      minAdvanceTime: {
        type: Number,
        default: 1, // hours
      },
      maxAdvanceTime: {
        type: Number,
        default: 90, // days
      },
      cancellationWindow: {
        type: Number,
        default: 24, // hours
      },
      rescheduleWindow: {
        type: Number,
        default: 1, // hours
      },
      maxReschedulesPerAppointment: {
        type: Number,
        default: 2,
      },
      requiresCustomerApproval: {
        type: Boolean,
        default: false,
      },
      allowWalkIns: {
        type: Boolean,
        default: true,
      },
      cancellationFee: {
        type: Number,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    subscriptionTier: {
      type: String,
      enum: ["free", "basic", "premium"],
      default: "free",
    },
    tags: [String],
    stats: {
      totalAppointments: {
        type: Number,
        default: 0,
      },
      totalCustomers: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
businessSchema.index({ adminId: 1 });
businessSchema.index({ category: 1 });
businessSchema.index({ isActive: 1 });

// Generate slug from name before saving
businessSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

const Business = mongoose.model("Business", businessSchema);

module.exports = Business;
