export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {

    const { awb } = req.query;

    if (!awb) {
      return res.json({ error: "AWB required" });
    }

    const delRes = await fetch(
      `https://track.delhivery.com/api/v1/packages/json/?waybill=${awb}`,
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

    return res.json({
      courier: "Delhivery",
      data: delData
    });

  } catch (err) {
    return res.status(500).json({
      error: err.toString()
    });
  }

}
