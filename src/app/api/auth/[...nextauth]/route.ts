import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import apiCaller from '@/components/axios';

// These two values should be a bit less than actual token lifetimes
const BACKEND_REFRESH_TOKEN_LIFETIME = 6 * 24 * 60 * 60;  // 6 days

const getCurrentEpochTime = () => {
  return Math.floor(new Date().getTime() / 1000);
};

const SIGN_IN_HANDLERS = {
  'credentials': async (user, account, profile, email, credentials) => {
    return true;
  },
};
const SIGN_IN_PROVIDERS = Object.keys(SIGN_IN_HANDLERS);

const getExpirationTime = () => {
  const t = new Date();
  t.setSeconds(t.getSeconds() + 30);
  return t.getTime();
}

async function refreshAccessToken(token) {
  console.log('token.refresh_token', token.refresh_token);
  try {
    const response = await apiCaller.post('account/auth/token/refresh/', {
      refresh: token.refresh_token
    }, { headers: { Authorization: null } });
    const { data } = response;
    console.log(data);

    token.access_token = data.access
    token.access_token_expires = getExpirationTime()
    token.refresh_token = data.refresh

    return token
  } catch (error) {
    console.log('RefreshAccessTokenError')

    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: BACKEND_REFRESH_TOKEN_LIFETIME,
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      // The data returned from this function is passed forward as the
      // `user` variable to the signIn() and jwt() callback
      authorize: async (credentials) => {
        try {
          const { email, password } = credentials;
          const response = await apiCaller.post('account/auth/login-password/', {
            email, password
          });
          const data = response.data;

          const headers = { Authorization: `Bearer ${data.access}` }
          const { data: profile } = await apiCaller.get('account/users/profile/v2/', { headers });


          if (data) {
            return {
              ...data,
              profile,
            };
          }
        } catch (error) {
          console.error(error);
        }
        return null;
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      if (!SIGN_IN_PROVIDERS.includes(account?.provider as keyof typeof SIGN_IN_HANDLERS)) return false;
      return SIGN_IN_HANDLERS[account?.provider as keyof typeof SIGN_IN_HANDLERS](
          user,
          account,
          profile,
          email,
          credentials
      );
    },
    async jwt({ user, token }) {
      // If `user` and `account` are set that means it is a login event
      if (user) {
        token.access_token = user.access
        token.refresh_token = user.refresh
        token.profile = user.profile
        token.access_token_expires = getExpirationTime()

        return token;

        delete user.access;
        delete user.refresh;
      }

      console.log({
        now: Date.now(),
        token: token.access_token_expires
      })

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.access_token_expires) {
        return token
      }

      // Access token has expired, try to update it
      apiCaller.defaults.headers.common.Authorization = undefined;
      return refreshAccessToken(token)
    },
    // Since we're using Django as the backend we have to pass the JWT
    // token to the client instead of the `session`.
    async session({ session, token }) {
      if (token) {
        session.access_token = token.access_token
        session.refresh_token = token.refresh_token
        session.error = token.error
      }

      return session;
    },
    async redirect({url, baseUrl, ...rest}) {
      console.log('rest', rest);

      return url;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
