// Redirect to the new vercel.js handler for consistency
const vercelHandler = require("./vercel");

// Simply pass all requests to the vercel.js handler
module.exports = vercelHandler;
