export default async function handler(req, res) {

  try {

    const { awb } = req.query;

    if (!awb) {
      return res.status(400).json({ error: "AWB required" });
    }

    // ---------- TRY DELHIVERY ----------
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

  console.log("Delhivery Response:", delData);

  if (delData && delData.ShipmentData && delData.ShipmentData.length > 0) {
    return res.json({
      courier: "Delhivery",
      data: delData
    });
  }

} catch (e) {
  console.log("Delhivery error:", e);
}


    // ---------- TRY SHIPROCKET ----------
    try {

      // Login
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
      const token = loginData.token;

      // Track
      const srTrack = await fetch(
        `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const srData = await srTrack.json();

      if (srData?.tracking_data) {
        return res.json({
          courier: "Shiprocket",
          data: srData
        });
      }

    } catch (e) {
      console.log("Shiprocket error");
    }

    return res.json({
      status: "Tracking not found"
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error"
    });
  }

}
