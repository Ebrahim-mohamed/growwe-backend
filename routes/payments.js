const express = require("express");
const router = express.Router();
const axios = require("axios");
const auth = require("../middleware/auth");
const User = require("../models/User");
const Order = require("../models/Order");

// Paymob API configuration
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

// Create payment
router.post("/create-pay", auth, async (req, res) => {
  try {
    const { amount_cents, order } = req.body;
    const user = await User.findById(req.userId).populate("cart.productId");

    // Step 1: Get authentication token
    const authResponse = await axios.post(
      "https://accept.paymob.com/api/auth/tokens",
      {
        api_key: PAYMOB_API_KEY,
      },
    );

    const authToken = authResponse.data.token;

    // Step 2: Create order
    const orderData = {
      auth_token: authToken,
      delivery_needed: "false",
      amount_cents: amount_cents,
      currency: "EGP",
      items: order.items,
    };

    const orderResponse = await axios.post(
      "https://accept.paymob.com/api/ecommerce/orders",
      orderData,
    );

    const orderId = orderResponse.data.id;

    // Step 3: Get payment key
    const paymentKeyData = {
      auth_token: authToken,
      amount_cents: amount_cents,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        apartment: user.area || "NA",
        email: user.email,
        floor: "NA",
        first_name: user.userName,
        street: user.address,
        building: "NA",
        phone_number: user.phone,
        shipping_method: "NA",
        postal_code: "NA",
        city: user.city,
        country: user.country,
        last_name: user.userName,
        state: user.area,
      },
      currency: "EGP",
      integration_id: PAYMOB_INTEGRATION_ID,
    };

    const paymentKeyResponse = await axios.post(
      "https://accept.paymob.com/api/acceptance/payment_keys",
      paymentKeyData,
    );

    const paymentToken = paymentKeyResponse.data.token;

    // Save order to database
    const newOrder = new Order({
      userId: req.userId,
      orderNumber: order.orderNumber,
      items: user.cart,
      totalAmount: amount_cents / 100,
      paymobOrderId: orderId,
      status: "pending",
    });

    await newOrder.save();

    // Return iframe URL
    const iframeURL = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;

    res.json({
      iframeURL,
      orderId: newOrder._id,
      paymobOrderId: orderId,
    });
  } catch (error) {
    console.error("Payment creation error:", error.response?.data || error);
    res.status(500).json({
      message: "Payment creation failed",
      error: error.response?.data || error.message,
    });
  }
});

// Paymob callback
router.post("/callback", async (req, res) => {
  try {
    const { obj } = req.body;

    // Find order by paymob order ID
    const order = await Order.findOne({ paymobOrderId: obj.order.id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order status based on payment success
    if (obj.success === true) {
      order.status = "paid";
      order.paymentDetails = {
        transactionId: obj.id,
        paidAt: new Date(),
      };

      // Clear user cart
      await User.findByIdAndUpdate(order.userId, { cart: [] });
    } else {
      order.status = "failed";
    }

    await order.save();

    res.json({ message: "Callback processed" });
  } catch (error) {
    console.error("Payment callback error:", error);
    res.status(500).json({ message: "Callback processing failed" });
  }
});

// Get order status
router.get("/order/:orderId", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      "items.productId",
    );

    if (!order || order.userId.toString() !== req.userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
