const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Veuillez entrer une adresse email valide",
        ],
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
    },
    profileImage: String,
    country: String,
    language: String,
    accountType: {
        type: String,
        enum: ["free", "premium"],
        default: "free",
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    privacySettings: {
        profileVisibility: {
            type: String,
            enum: ["public", "private"],
            default: "public",
        },
        playlistsVisibility: {
            type: String,
            enum: ["public", "private"],
            default: "public",
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Index pour améliorer les performances de recherche
userSchema.index({ email: 1, username: 1 });

// Middleware pour hasher le mot de passe avant la sauvegarde
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        this.updatedAt = Date.now();
        next();
    } catch (error) {
        next(error);
    }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour retourner l'objet user sans le mot de passe
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
