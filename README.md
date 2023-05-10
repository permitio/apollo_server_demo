# Apollo x Permit tutorial

This is the fullstack app for the [Apollo x Permit tutorial](https://docs.permit.io/integrations/GraphQL/overview). 🚀


## Installation

Change the ENV_API_SECRET inside index.js to your own, you can copy it from the code example in this page [Permit connect sdk](https://app.permit.io/get-started/connect-an-sdk), and replace it with the token placeholder in the code.

After that you can run the Apollo server by running:

```bash
cd final/server && npm i && npm start
```

Then you can connect to `http://localhost:4000/` and send queries or mutations to the Apollo server.

In this demo we have 2 types of Permit checks, one with Permission Map and the other is with Auto Detect.


The first one will be used this permission map:
```js
const PermissionMap = {
  "login": {resource: "user", action: "login"},
  "logout": {resource: "user", action: "logout"},
  "me": {resource: "user", action: "get"},
  "launches": {resource: "launch", action: "getall"},
  "getlaunch": {resource: "launch", action: "get"},
}
```
So if you want the permission check to pass, and return true, make sure you:
1. Create a user in Permit with this key `apollo_server@test.com` (or in any other name but then you need to change the code)
2. (Create a policy according to this Permission map)[https://app.permit.io/policy-editor] (e.g create a resource named `launch`, with `getall` and `get`)
3. Create an admin role, and give him all the permissions
4. Assign your user the admin role

You can also use instead the `permitPluginAutoDetect` plugin, and then you will need to create a different policy inside permit.
e.g: 
resource: launches, action: read, write
resource: login, action: read, write

And then do the stages 3 and 4 from above