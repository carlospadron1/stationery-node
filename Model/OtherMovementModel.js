const mongoose = require("mongoose");

const otherMovementSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, "La descripción es requerida"],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, "La cantidad es requerida"],
  },
  date: {
    type: Date,
  },
  type: {
    type: String,
  },
});

const OtherMovement = new mongoose.model("OtherMovement", otherMovementSchema);

module.exports = OtherMovement;
