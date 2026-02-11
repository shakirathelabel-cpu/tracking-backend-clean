export default function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {

    return res.json({
      ok: true,
      message: "API alive",
      query: req.query
    });

  } catch (err) {
    return res.status(500).json({
      error: err.toString()
    });
  }

}
