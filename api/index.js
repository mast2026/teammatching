import { handler } from "../netlify/functions/api.js";

const readBody = async (req) => {
  if (req.body === undefined) {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString("utf8");
  }
  if (typeof req.body === "string") return req.body;
  return JSON.stringify(req.body);
};

export default async function vercelApi(req, res) {
  const url = new URL(req.url, "http://localhost");
  const rewrittenPath = url.searchParams.get("path");
  const path = rewrittenPath ? `/api/${rewrittenPath}` : url.pathname;
  const queryStringParameters = Object.fromEntries(url.searchParams.entries());
  delete queryStringParameters.path;

  const result = await handler({
    path,
    httpMethod: req.method,
    headers: req.headers,
    body: await readBody(req),
    queryStringParameters
  });

  for (const [key, value] of Object.entries(result.headers ?? {})) {
    res.setHeader(key, value);
  }

  res.status(result.statusCode ?? 200).send(result.body ?? "");
}
