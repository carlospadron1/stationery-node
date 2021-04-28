const mongoose = require("mongoose");

let quoteSchema = new mongoose.Schema({
  concept: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
  },
  total: {
    type: Number,
    required: [true, "El total de la cotización es requerido"],
  },
  discount: {
    type: Number,
  },
  service: {
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
  quoteDetail: [
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
});

let quoteModel = new mongoose.model("Quote", quoteSchema);

module.exports = quoteModel;
