const express = require("express");
const multer = require("multer");

const app = express();
const upload = multer();

// Fallback para quem mandar o corpo inteiro como binário cru
app.use(express.raw({ type: '*/*', limit: '50mb' }));

app.post("/to-base64", upload.single("data"), (req, res) => {
  try {
    // 1) Caso venha multipart/form-data com o campo "data" (n8n: Input Data Field Name = data)
    if (req.file && req.file.buffer) {
      const mime = req.file.mimetype || "application/octet-stream";
      const base64 = req.file.buffer.toString("base64");
      const dataUrl = `data:${mime};base64,${base64}`;
      return res.status(200).json({
        ok: true,
        source: "multipart:data",
        mimeType: mime,
        base64,
        dataUrl,
      });
    }

    // 2) Fallback: caso venha como binário cru no body
    if (req.body && req.body.length) {
      const mime =
        req.headers["content-type"]?.split(";")[0] || "application/octet-stream";
      const base64 = Buffer.from(req.body).toString("base64");
      const dataUrl = `data:${mime};base64,${base64}`;
      return res.status(200).json({
        ok: true,
        source: "raw-body",
        mimeType: mime,
        base64,
        dataUrl,
      });
    }

    return res
      .status(400)
      .json({ ok: false, error: "Nenhum arquivo recebido no campo 'data' nem no corpo bruto." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Falha ao converter para Base64." });
  }
});

app.get("/", (_req, res) => res.send("POST /to-base64 (multipart campo 'data' ou body cru)"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`to-base64 rodando na porta ${port}`));
