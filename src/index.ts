import { Hono } from "hono";
import { api } from "@routes/api";
import { fragments } from "@routes/fragments";
import { dashboardPage } from "@routes/pages/dashboard";
import { blockerTrendPage } from "@routes/pages/blocker-trend";

export const app = new Hono();

app.route("/api", api);
app.route("/fragments", fragments);
app.route("/", dashboardPage);
app.route("/blockers", blockerTrendPage);
app.get("/health", (c) => c.json({ ok: true, service: "standup-signal" }));

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
};
