const mongoose = require("mongoose");

let saleSchema = new mongoose.Schema({
  concept: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
  },
  total: {
    type: Number,
    required: [true, "El total de la venta es requerido"],
  },
  discount: {
    type: Number,
  },
  extra: {
    type: Number,
  },
  canceled: {
    type: Boolean,
    default: false,
  },
  changed: {
    type: Boolean,
    default: false,
  },
  madeBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  saleDetail: [
    {
      productID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
      },
      unitPrice: {
        type: Number,
      },
    },
  ],
  serviceDetail: [
    {
      description: {
        type: String,
        trim: true,
      },
      total: {
        type: Number,
      },
    },
  ],
});

let saleModel = new mongoose.model("Sale", saleSchema);

module.exports = saleModel;
