const { handler } = require("../autotasks/relay");

// Run autotask code locally using the Relayer API key and secret
if (require.main === module) {
  require("dotenv").config();
  const { RELAYER_API_KEY: apiKey, RELAYER_API_SECRET: apiSecret } =
    process.env;

  const payloadApprove = require("fs").readFileSync("tmp/requestApprove.json");
  handler(
    { apiKey, apiSecret, request: { body: JSON.parse(payloadApprove) } },
    "approve"
  )
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });

  const payloadBuy = require("fs").readFileSync("tmp/requestBuy.json");
  handler(
    { apiKey, apiSecret, request: { body: JSON.parse(payloadBuy) } },
    "buy"
  )
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
