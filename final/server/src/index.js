require('dotenv').config();
const { Permit } = require("permitio");

const { ApolloServer } = require('apollo-server');
const { ApolloServerPluginLandingPageLocalDefault } = require('apollo-server-core');
const isEmail = require('isemail');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { createStore } = require('./utils');

const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');

// creates a sequelize connection once. NOT for every request
const store = createStore();

// set up any dataSources our resolvers need
const dataSources = () => ({
  launchAPI: new LaunchAPI(),
  userAPI: new UserAPI({ store }),
});

// the function that sets up the global context for each resolver, using the req
const context = async ({ req }) => {
  // simple auth check on every request
  const auth = (req.headers && req.headers.authorization) || '';
  const email = Buffer.from(auth, 'base64').toString('ascii');


  // if the email isn't formatted validly, return null for user
  if (!isEmail.validate(email)) return { user: null };
  // find a user by their email
  const users = await store.users.findOrCreate({ where: { email } });
  const user = users && users[0] ? users[0] : null;

  return { user };
};
const permit = new Permit({
  // in production, you might need to change this url to fit your deployment
  pdp: "https://cloudpdp.api.permit.io",
  // your api key
  token: "permit_key_<ENV_API_SECRET>"
});

async function getUserFromJWT(token) {
  // In real life, you would use the token to get the user id from the JWT/cookie/etc.
  return "apollo_server@test.com";
}
const PermissionMap = {
  "login": {resource: "user", action: "login"},
  "logout": {resource: "user", action: "logout"},
  "me": {resource: "user", action: "get"},
  "launches": {resource: "launch", action: "getall"},
  "getlaunch": {resource: "launch", action: "get"},
}

const permitPlugin = {
  async requestDidStart(context) {
    const operationName = context.request.operationName;
    var user = await getUserFromJWT("");
    let allowed = false;
    if (operationName.toLowerCase() in PermissionMap) {
      const { resource, action } = PermissionMap[operationName.toLowerCase()];
      allowed = await permit.check(user, action, resource);
    }
    else {
      console.warn('No such operation in PermissionMap', operationName);
    }
    if (!allowed) {
      throw new Error("Not allowed");
    }
  },
};

// If you want to use this plugin, comment out the permitPlugin above and add this plugin in the plugins array below
const permitPluginAutoDetect = {
  requestDidStart(requestContext) {

    return {
      async didResolveOperation (context) {
        const op = context.operationName
        var user = await getUserFromJWT("");
        isMutation = context.operation.operation === 'mutation'
        const allowed = await permit.check(userId, isMutation? "write": "read", op.toLowerCase()) // this will look like "action: write, resource:launches" or "action: read, resource:launches"
        if (!allowed) {
          throw new Error("Not allowed");
        }
      },

    }
  },
}


// Set up Apollo Server
const server = new ApolloServer({
  debug: true,
  typeDefs,
  resolvers,
  dataSources,
  context,
  introspection: true,
  apollo: {
    key: process.env.APOLLO_KEY,
  },
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true }),permitPlugin]
});

// Start our server if we're not in a test env.
// if we're in a test env, we'll manually start it in a test
if (process.env.NODE_ENV !== 'test') {
  server.listen().then(() => {
    console.log(`Server is running at http://localhost:4000`);
  });
}

// export all the important pieces for integration/e2e tests to use
module.exports = {
  dataSources,
  context,
  typeDefs,
  resolvers,
  ApolloServer,
  LaunchAPI,
  UserAPI,
  store,
  server,
};
