export default async function handler(req, res) {

  // CORS
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

    // -------- ORDER MAP SAFE --------
    const ORDER_MAP = {
      "#6417": "6973810038360",
      "#6376": "6973810038205"
    };

    let searchAwb = ORDER_MAP[awb] ? ORDER_MAP[awb] : awb;

    let debug = {};

    // ---------- DELHIVERY ----------
    try {

      const delRes = await fetch(
        `https://track.delhivery.com/api/v1/packages/json/?waybill=${searchAwb}`,
        {
          headers: {
            "Authorization": "Token " + process.env.DEL_TOKEN
          }
        }
      );

      const delText = await delRes.text();
      let delData;

      try {
        delData = JSON.parse(delText);
      } catch {
        delData = delText;
      }

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

      const loginText = await loginRes.text();
      let loginData;

      try {
        loginData = JSON.parse(loginText);
      } catch {
        loginData = loginText;
      }

      debug.shiprocket_login = loginData;

      if (loginData?.token) {

        const srTrack = await fetch(
          `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${searchAwb}`,
          {
            headers: {
              Authorization: `Bearer ${loginData.token}`
            }
          }
        );

        const srText = await srTrack.text();
        let srData;

        try {
          srData = JSON.parse(srText);
        } catch {
          srData = srText;
        }

        debug.shiprocket_track = srData;

        if (srData?.tracking_data) {
          return res.json({
            courier: "Shiprocket",
            data: srData
          });
        }

      }

    } catch (e) {
      debug.shiprocket_error = e._
