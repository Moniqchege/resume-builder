import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

export const setupOAuth = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      (accessToken, refreshToken, profile, done) => {
        done(null, profile);
      }
    )
  );

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: process.env.GITHUB_CALLBACK_URL!,
      },
      (accessToken, refreshToken, profile, done) => {
        done(null, profile);
      }
    )
  );

//   passport.use(
//     new LinkedInStrategy(
//       {
//         clientID: process.env.LINKEDIN_CLIENT_ID!,
//         clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
//         callbackURL: process.env.LINKEDIN_CALLBACK_URL!,
//         scope: ["r_emailaddress", "r_liteprofile"],
//       },
//       (accessToken, refreshToken, profile, done) => {
//         done(null, profile);
//       }
//     )
//   );

//   passport.use(
//     new MicrosoftStrategy(
//       {
//         clientID: process.env.MICROSOFT_CLIENT_ID!,
//         clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
//         callbackURL: process.env.MICROSOFT_CALLBACK_URL!,
//         scope: ["user.read"],
//       },
//       (accessToken, refreshToken, profile, done) => {
//         done(null, profile);
//       }
//     )
//   );
};
