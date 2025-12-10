import express from "express";
import handler from "serve-handler";

const app = express();

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use((req, res) => handler(req, res, { public: "dist" }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Static server with COOP/COEP listening on ${port}`);
});
