export default async function handler(req, res) {

  try {

    const { awb } = req.query;

    if (!awb) {
      return res.status(400).json({ error: "AWB required" });
    }

    let debug = {};

    // ---------- DELHIVERY DEBUG ----------
    try {

      const delRes = await fetch(
        `https://track.delhivery.com/api/v1/packages/json/?waybill=${awb}`,
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

    // ---------- SHIPROCKET DEBUG ----------
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

      const srTrack = await fetch(
        `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const srData = await srTrack.json();
      debug.shiprocket_track = srData;

      if (srData?.tracking_data) {
        return res.json({
          courier: "Shiprocket",
          data: srData
        });
      }

    } catch (e) {
      debug.shiprocket_error = e.toString();
    }

    return res.json({
      status: "Tracking not found",
      debug: debug
    });

  } catch (err) {
    return res.status(500).json({
      error: err.toString()
    });
  }

}
