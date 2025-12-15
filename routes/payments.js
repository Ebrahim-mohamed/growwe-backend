// backend/routes/payments.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const Order = require("../models/Order");
const { requireAuth } = require("../middleware/auth");

// NOTE: this is a skeleton for Paymob. Fill with your keys and confirm flow with Paymob docs.

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_BASE = "https://accept.paymob.com/api";

router.post("/create-pay", requireAuth, async (req, res) => {
  try {
    const { amount_cents, order } = req.body; // amount in cents, order object prepared on frontend or backend

    // 1) Get Paymob auth token
    const auth = await axios.post(`${PAYMOB_BASE}/auth/tokens`, {
      api_key: PAYMOB_API_KEY,
    });

    const token = auth.data.token;

    // 2) Register order
    const registerOrder = await axios.post(`${PAYMOB_BASE}/ecommerce/orders`, {
      auth_token: token,
      delivery_needed: false,
      amount_cents,
      currency: "EGP",
      items: order.items || [],
      merchant_order_id: order.orderNumber || `local-${Date.now()}`,
    });

    const payOrderId = registerOrder.data.id;

    // 3) Request payment key
    const paymentReq = {
      auth_token: token,
      amount_cents,
      expiration: 3600,
      order_id: payOrderId,
      billing_data: order.billing_data || {},
      currency: "EGP",
      integration_id: Number(PAYMOB_INTEGRATION_ID),
    };
    const paymentKeyResp = await axios.post(
      `${PAYMOB_BASE}/acceptance/payment_keys`,
      paymentReq
    );
    const paymentToken = paymentKeyResp.data.token;

    // 4) Build iframe URL for frontend
    const iframeURL = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;

    res.json({ iframeURL, paymentToken });
  } catch (err) {
    console.error("Paymob error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// Webhook endpoint (Paymob will call this)
router.post("/webhook", async (req, res) => {
  // validate signature if required, then update order status
  const payload = req.body;
  // Locate order by merchant_order_id or other fields and update status
  // Example (pseudo):
  // const merchantOrderId = payload.order && payload.order.id;
  // await Order.findOneAndUpdate({ /*match*/ }, { status: 'Completed', paymentInfo: payload })
  res.sendStatus(200);
});

module.exports = router;
