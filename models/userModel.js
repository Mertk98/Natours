const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name!'],
      unique: true,
      trim: true,
      maxLength: [20, 'A name must have at most 20 characters!!!'],
      validate: {
        validator: (val) =>
          validator.isAlphanumeric(val, ['en-US'], {
            ignore: ' _-$',
          }),
        message:
          "Name can only contain letters, numbers, space, '_', '-' and '$'.",
      },
    },
    email: {
      type: String,
      required: [true, 'Please provide a valid email!!'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email!!'],
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Password is a required field'],
      minLength: [8, 'Password must have at least 8 characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Password must be confirmed'],
      validate: {
        // check if the password equals to passwordConfirm
        validator: function (val) {
          // This only works on create and saves
          return val === this.password;
        },
        message: 'Passwords do not match!!!',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJson: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  // prevent confusions between time stapms of jwt and passwordChangedAt
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', async function (next) {
  // Only run this function if passwords was actually modified
  if (!this.isModified('password')) {
    return next();
  }

  // Hash the password with cost of 12 and delete the confirm password field
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

// Query middleware
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = this.passwordChangedAt.getTime() / 1000;

    return JWTTimestamp < changedTimeStamp;
  }
  // This means not changed, therefore, return false
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(36).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, '\n', this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
