export default async function handler(req, res) {

  // CORS FIX
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {

    const { awb } = req.query;

    if (!awb) {
      return res.status(400).json({ error: "AWB required" });
    }

    // -------- ORDER ID → AWB MAP --------
    const ORDER_MAP = {
      "#6417": "6973810038360",
      "#6376": "6973810038205"
    };

    // Convert Order ID → AWB if exists
    let searchAwb = ORDER_MAP[awb] || awb;

    let debug = {};

    // ---------- DELHIVERY ----------
    try {

      const delRes = await fetch(
        `https://track.delhivery.com/api/v1/packages/json/?waybill=${searchAwb}`,
        {
          method: "GET",
          headers: {
            "Authorization": "Token " + process.env.DEL_TOKEN,
            "Content-Type": "application/json"
          }
        }
      );

      const delData = await delRes.json();
      debug.delhivery = delData;

      if (delData?.ShipmentData?.length > 0) {
        return res.json({
          courier: "Delhivery",
          data: delData
        });
      }

    } catch (e) {
      debug.delhivery_error = e.toString();
    }

    // ---------- SHIPROCKET ----------
    try {

      const loginRes = await fetch(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: process.env.SR_EMAIL,
            password: process.env.SR_PASSWORD
          })
        }
      );

      const loginData = await loginRes.json();
      debug.shiprocket_login = loginData;

      const token = loginData.token;

      if (token) {

        const srTrack = await fetch(
          `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${searchAwb}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const srData = await srTrack.json();
        debug.shiprocket_track = sr_
