"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
const List_1 = __importDefault(require("../models/List"));
dotenv_1.default.config();
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = (profile.emails?.[0]?.value || "").toLowerCase();
        // Look up by googleId or existing email to avoid unique email conflicts
        let user = await User_1.default.findOne({
            $or: [{ googleId: profile.id }, { email }],
        });
        let isNewUser = false;
        if (!user) {
            user = await User_1.default.create({
                googleId: profile.id,
                name: profile.displayName || email || "Google User",
                email: email || undefined,
                avatarUrl: profile.photos?.[0]?.value,
            });
            isNewUser = true;
        }
        else {
            // Link googleId to existing local account if missing
            if (!user.googleId) {
                user.googleId = profile.id;
                if (!user.avatarUrl && profile.photos?.[0]?.value) {
                    user.avatarUrl = profile.photos[0].value;
                }
                await user.save();
            }
        }
        // Create default lists for new Google OAuth users (Passport flow)
        if (isNewUser) {
            await List_1.default.create([
                {
                    userId: user._id,
                    name: "Inbox",
                    description: "Default inbox for all unorganized tasks",
                    isDefault: true,
                    icon: "inbox",
                    color: "#3B82F6",
                    order: 0,
                },
                {
                    userId: user._id,
                    name: "Today",
                    description: "Tasks to complete today",
                    isDefault: true,
                    icon: "calendar",
                    color: "#10B981",
                    order: 1,
                },
                {
                    userId: user._id,
                    name: "Upcoming",
                    description: "Tasks scheduled for the future",
                    isDefault: true,
                    icon: "clock",
                    color: "#F59E0B",
                    order: 2,
                },
            ]);
        }
        const userInfo = {
            userId: user.id,
            email: user.email,
        };
        return done(null, userInfo);
    }
    catch (err) {
        done(err, undefined);
    }
}));
// Required for persistent login sessions
passport_1.default.serializeUser((user, done) => done(null, user.userId));
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const userDoc = await User_1.default.findById(id);
        if (!userDoc) {
            done(null, false);
            return;
        }
        const user = {
            userId: userDoc.id,
            email: userDoc.email,
        };
        done(null, user);
    }
    catch (err) {
        done(err, null);
    }
});
exports.default = passport_1.default;
