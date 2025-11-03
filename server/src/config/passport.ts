import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import dotenv from "dotenv";
import User, { IUser } from "../models/User";
import List from "../models/List";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback",
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = (profile.emails?.[0]?.value || "").toLowerCase();

        // Look up by googleId or existing email to avoid unique email conflicts
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        let isNewUser = false;
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName || email || "Google User",
            email: email || undefined,
            avatarUrl: profile.photos?.[0]?.value,
          });
          isNewUser = true;
        } else {
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
          await List.create([
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

        const userInfo: Express.User = {
          userId: user.id,
          email: (user as IUser).email,
        };
        return done(null, userInfo);
      } catch (err) {
        done(err as any, undefined);
      }
    }
  )
);

// Required for persistent login sessions
passport.serializeUser((user: Express.User, done) => done(null, user.userId));
passport.deserializeUser(async (id: string, done) => {
  try {
    const userDoc = await User.findById(id);
    if (!userDoc) {
      done(null, false);
      return;
    }
    const user: Express.User = {
      userId: userDoc.id,
      email: (userDoc as IUser).email,
    };
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
