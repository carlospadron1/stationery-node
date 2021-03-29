const errorHandler = require("../Utils/Helpers/errorHandler");

const index = (req, res) => {
  console.log("index");
  res.render("inventario/productos", {
    sectionName: "Productos",
    script: "productosClient",
    activeMenu: "INVTRO",
    activeSubmenu: "PRDCTS",
  });
};

module.exports = {
  index,
};