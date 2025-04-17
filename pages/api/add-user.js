import { update } from "@vercel/edge-config";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { duprid, nickname } = req.body;
  if (!duprid || !nickname) return res.status(400).json({ error: "Missing fields" });

  const users = (await (await fetch(`https://edge-config.vercel.com/${process.env.EDGE_CONFIG}/item/users`, {
    headers: {
      Authorization: `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
    },
  })).json()) || [];

  const updated = [...users, { duprid, nickname }];

  const updateRes = await fetch(`https://edge-config.vercel.com/${process.env.EDGE_CONFIG}/items`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
    },
    body: JSON.stringify({ items: [{ operation: "update", key: "users", value: updated }] }),
  });

  if (!updateRes.ok) return res.status(500).json({ error: "Failed to update Edge Config" });

  res.status(200).json({ success: true });
}