window.addEventListener("DOMContentLoaded", () => {
  let $fields = [
    "name",
    "brand",
    "articleType",
    "discount",
    "concept",
    "extra",
  ];

  let routes = {
    showProducts: "/getProductsWithStock",
    registerQuote: "/actualizar-cotizacion",
    sellQuote: "/vender-cotizacion",
  };

  let productsData = [];
  let shoppingCart = [];
  let servicesCart = [];
  let subTotal = 0;
  let total = 0;

  const searchBtn = document.querySelector("#btnSearch");
  const searchForm = document.querySelector("#searchForm");
  const btnClearSearch = document.querySelector("#btnClearSearch");
  const registerQuoteBtn = document.querySelector("#registerQuote");
  const sellQuoteBtn = document.querySelector("#sellQuote");
  const mainCardTable = document.querySelector("#productsTable");
  const cartProductTable = document.querySelector("#cart-products-table");
  const cartServiceTable = document.querySelector("#cart-service-table");
  const showServiceModalBtn = document.querySelector("#showServiceModalBtn");
  const btnAddService = document.querySelector("#btnAddService");
  const discountInput = document.querySelector("#discount");
  const extraInput = document.querySelector("#extra");

  searchBtn.addEventListener("click", search);
  btnClearSearch.addEventListener("click", clearSearch);
  showServiceModalBtn.addEventListener("click", showServiceModalBtnClicked);
  btnAddService.addEventListener("click", addServiceToTable);
  registerQuoteBtn.addEventListener("click", registerQuoteBtnClick);
  sellQuoteBtn.addEventListener("click", sellQuoteBtnClick);
  discountInput.addEventListener("input", validateDiscount);
  extraInput.addEventListener("input", validateExtra);
  mainCardTable.addEventListener("click", mainCardTableRowClicked);
  cartProductTable.addEventListener("click", cartProductTableRowClicked);
  cartServiceTable.addEventListener("click", serviceTableRowClicked);

  //Search products
  async function search() {
    blockElem(searchForm);
    let body = {};

    $fields.forEach((elem) => {
      let elemData = document.querySelector(`[data-search="${elem}"]`);

      if (elemData != undefined) {
        let data = elemData.value.trim();
        body[elem] = data;
      }
    });

    try {
      body = JSON.stringify(body);

      let request = await fetch(routes.showProducts, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          credentials: "same-origin",
        },
        body,
      });

      let json = await request.json();
      if (json.error) {
        if (Array.isArray(json.message)) {
          let messages = "";
          json.message.forEach((msg) => {
            messages += `<strong>*${msg}</strong> <br>`;
          });
          modalAlert("warning", "Aviso", messages);
          unblockElem(searchForm);
          return;
        } else {
          modalAlert(
            "warning",
            "Aviso",
            `<strong>*${json.message}</strong> <br>`
          );
          unblockElem(searchForm);
          return;
        }
      }

      productsData = json.response;

      productsData.forEach((elem, index) => {
        elem.actions = `
          <button title="Agregar" type="button" class="btn btn-sm btn-icon btn-warning add w-100" data-index="${index}" data-id="${elem._id}" > <i class="uil uil-plus-circle"></i> Agregar</button>
      `;
      });

      productsTable.reloadCardTable(productsData);
      unblockElem(searchForm);
    } catch (error) {
      unblockElem(searchForm);
      errorNotification("Error interno del servidor");
      console.error(error);
    }
  }

  async function updateOrSellQuote(quoteInfo, update) {
    try {
      disabledButtons(update);

      quoteInfo._id = quoteID;
      console.log(quoteInfo);
      let body = JSON.stringify(quoteInfo);

      let request = await fetch(
        update == true ? routes.registerQuote : routes.sellQuote,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            credentials: "same-origin",
          },
          body,
        }
      );

      let json = await request.json();

      console.log("json", json);
      if (json.error) {
        if (Array.isArray(json.message)) {
          let messages = "";
          json.message.forEach((msg) => {
            messages += `<strong>*${msg}</strong> <br>`;
          });

          modalAlert("warning", "Aviso", messages);

          enableButtons(update);

          return;
        } else {
          modalAlert(
            "warning",
            "Aviso",
            `<strong>${json.message}</strong> <br>`
          );

          enableButtons(update);

          return;
        }
      }

      enableButtons(update);

      resetForm("shopping-cart");

      modalAlert(
        "success",
        "Aviso ",
        `<strong>${json.message}</strong> <br>`,
        () => {
          $("#main_modal").modal("hide");
          window.location =
            update == true
              ? `/cotizaciones/detalle/${json.response}`
              : `/ventas/detalle/${json.response}`;
        }
      );
    } catch (error) {
      errorNotification("Error interno del servidor");
      enableButtons(update);

      console.error(error);
    }
  }

  function enableButtons(update) {
    if (update) {
      console.log("tru");
      enableButton(registerQuoteBtn, "Actualizar Cotización");
      console.log(sellQuoteBtn);
      sellQuoteBtn.removeAttribute("disabled");
      console.log(sellQuoteBtn);
    } else {
      enableButton(sellQuoteBtn, "Vender Cotización");
      registerQuoteBtn.removeAttribute("disabled");
    }
  }

  function disabledButtons(update) {
    if (update) {
      disableButton(registerQuoteBtn, "Actualizando Cotización");
      sellQuoteBtn.setAttribute("disabled", true);
    } else {
      disableButton(sellQuoteBtn, "Vendiendo Cotización");
      registerQuoteBtn.setAttribute("disabled", true);
    }
  }

  function resetForm(form) {
    switch (form) {
      case "shopping-cart":
        shoppingCart = [];
        servicesCart = [];

        document.querySelector(`#concept`).value = "";
        document.querySelector(`#discount`).value = "";
        document.querySelector(`#extra`).value = "";
        populateProductTable();
        populateSeriviceTable();
        break;
      case "serviceForm":
        document.querySelector(`#description`).value = "";
        document.querySelector(`#totalService`).value = "";
        break;
      case "searchForm":
        document.querySelector("#searchForm").reset();
        break;
    }
  }

  function clearSearch() {
    resetForm("searchForm");
  }

  function registerQuoteBtnClick() {
    if (shoppingCart.length === 0 && servicesCart.length === 0) {
      errorNotification(
        "No tienes productos ni servicios en la cotización. Agrega productos o servicios para realizar la cotización"
      );
      return;
    }

    if (total < 0) {
      errorNotification(
        "El total de la cotización no puede ser menor a 0. Revisa la cotización y el descuento que hayas ingresado."
      );
      return;
    }
    //Resets form Validation
    resetCartFormValidation();

    //Resets validates cartForms and returns if it´s valid and its info
    let response = validateCartForm();

    if (response.valid === false) {
      return;
    }

    registerQuoteUpdateConfirmation(response.body);
  }

  function sellQuoteBtnClick() {
    if (shoppingCart.length === 0 && servicesCart.length === 0) {
      errorNotification(
        "No tienes productos ni servicios en la cotización. Agrega productos o servicios para realizar la cotización"
      );
      return;
    }

    if (total < 0) {
      errorNotification(
        "El total de la cotización no puede ser menor a 0. Revisa la cotización y el descuento que hayas ingresado."
      );
      return;
    }

    //Resets form Validation
    resetCartFormValidation();

    //Resets validates cartForms and returns if it´s valid and its info
    let response = validateCartForm();

    if (response.valid === false) {
      return;
    }

    sellQuoteConfirmation(response.body);
  }

  function registerQuoteUpdateConfirmation(quoteInfo) {
    confirmationAlert("Se actualizará la cotización", () => {
      updateOrSellQuote(quoteInfo, true);
    });
  }

  function sellQuoteConfirmation(quoteInfo) {
    confirmationAlert("Se venderá la cotización", () => {
      updateOrSellQuote(quoteInfo, false);
    });
  }

  function validateCartForm() {
    let body = {};
    let valid = true;

    $fields.forEach((elem) => {
      let data;
      let msg;

      switch (elem) {
        case "discount":
          data = document.querySelector(`#${elem}`);
          body[elem] = data.value ?? 0;
          break;

        case "concept":
          data = document.querySelector(`#${elem}`);
          msg = document.querySelector(`#${elem}Msg`);

          if (!data.value) {
            data.classList.add("invalid-input");
            msg.innerHTML += "El concepto es requerido.";
            valid = false;
          }
          body[elem] = data.value;
          break;

        case "extra":
          data = document.querySelector(`#${elem}`);
          body[elem] = data.value;
          break;
      }
    });

    let quoteDetail = [];

    console.log(shoppingCart);
    shoppingCart.forEach((elem) => {
      quoteDetail.push({
        productID: elem.id,
        productName: elem.productName,
        quantity: elem.quantity,
        unitPrice: elem.unitPrice,
      });
    });

    body.quoteDetail = quoteDetail;
    body.serviceDetail = servicesCart;

    body.total = total;

    return {
      valid,
      body,
    };
  }

  function resetCartFormValidation() {
    $fields.forEach((elem) => {
      switch (elem) {
        case "concept":
          data = document.querySelector(`#${elem}`);
          msg = document.querySelector(`#${elem}Msg`);

          data.classList.remove("invalid-input");
          msg.innerHTML = "";

          break;
      }
    });
  }

  function validateServiceForm() {
    let body = {};
    let valid = true;

    $serviceFields.forEach((elem) => {
      let data;
      let msg;

      switch (elem) {
        case "description":
          data = document.querySelector(`#${elem}`);
          msg = document.querySelector(`#${elem}Msg`);

          if (!data.value) {
            data.classList.add("invalid-input");
            msg.innerHTML += "La descripción es requerida.";
            valid = false;
          }
          body[elem] = data.value;
          break;

        case "totalService":
          data = document.querySelector(`#${elem}`);
          msg = document.querySelector(`#${elem}Msg`);

          if (!data.value) {
            data.classList.add("invalid-input");
            msg.innerHTML += "El total es requerido.";
            valid = false;
          }
          body[elem] = data.value;
          break;
      }
    });

    return {
      valid,
      body,
    };
  }

  function resetServiceFormValidation() {
    $serviceFields.forEach((elem) => {
      switch (elem) {
        case "description":
          data = document.querySelector(`#${elem}`);
          msg = document.querySelector(`#${elem}Msg`);

          msg.innerHTML = "";

          break;
        case "totalService":
          data = document.querySelector(`#${elem}`);
          msg = document.querySelector(`#${elem}Msg`);

          msg.innerHTML = "";

          break;
      }
    });
  }

  function addServiceToTable() {
    resetServiceFormValidation();

    let response = validateServiceForm();

    if (response.valid) {
      addService(response.body);
      $("#main_modal").modal("hide");
    }
  }

  //Listen when an element from the table is clicked
  function mainCardTableRowClicked(e) {
    if (e.target && e.target.classList.contains("add")) {
      if (e.target.tagName === "I") {
        let button = e.target.parentElement;
        let index = button.getAttribute("data-index");
        //Agregar al carrito
        addToCart(productsData[index]);
      } else {
        let button = e.target;
        let index = button.getAttribute("data-index");
        //Agregar al carrito
        addToCart(productsData[index]);
      }
    }
  }

  //Listen when an element from the table is clicked
  function cartProductTableRowClicked(e) {
    if (e.target.classList.contains("add")) {
      if (e.target.tagName === "I") {
        let button = e.target.parentElement;
        let index = button.getAttribute("data-index");
        addMoreProduct(index);
      } else {
        let button = e.target;
        let index = button.getAttribute("data-index");
        addMoreProduct(index);
      }
    }
    if (e.target.classList.contains("remove")) {
      if (e.target.tagName === "I") {
        let button = e.target.parentElement;
        let index = button.getAttribute("data-index");
        removeProduct(index);
      } else {
        let button = e.target;
        let index = button.getAttribute("data-index");
        removeProduct(index);
      }
    }
  }

  //Listen when an element from the table is clicked
  function serviceTableRowClicked(e) {
    if (e.target.classList.contains("remove")) {
      if (e.target.tagName === "I") {
        let button = e.target.parentElement;
        let index = button.getAttribute("data-index");
        removeService(index);
      } else {
        let button = e.target;
        let index = button.getAttribute("data-index");
        removeService(index);
      }
    }
  }

  //Increases the number of products of the same article
  function addMoreProduct(productIndex) {
    if (
      shoppingCart[productIndex].quantity ==
      shoppingCart[productIndex].totalStock
    ) {
      return;
    }
    shoppingCart[productIndex].quantity++;
    shoppingCart[productIndex].total += shoppingCart[productIndex].unitPrice;

    populateProductTable();
  }

  //reduces or removes products
  function removeProduct(productIndex) {
    shoppingCart[productIndex].quantity--;
    shoppingCart[productIndex].total -= shoppingCart[productIndex].unitPrice;

    if (shoppingCart[productIndex].quantity == 0) {
      shoppingCart.splice(productIndex, 1);
    }

    populateProductTable();
  }

  //reduces or removes services
  function removeService(productIndex) {
    servicesCart.splice(productIndex, 1);
    populateSeriviceTable();
  }

  //add products to the cart
  function addToCart(product) {
    if (shoppingCart.length == 0) {
      shoppingCart.push({
        id: product._id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1,
        total: product.price,
        totalStock: product.quantity,
      });
    } else {
      let productIndex = shoppingCart.findIndex(
        (prod) => prod.id === product._id
      );

      if (productIndex != -1) {
        if (shoppingCart[productIndex].quantity == product.quantity) {
          return;
        }
        shoppingCart[productIndex].quantity++;
        shoppingCart[productIndex].total +=
          shoppingCart[productIndex].unitPrice;
      } else {
        shoppingCart.push({
          id: product._id,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
          total: product.price,
          totalStock: product.quantity,
        });
      }
    }

    populateProductTable();
  }

  //cartProductTableFunction
  function populateProductTable() {
    if (shoppingCart.length == 0) {
      cartProductTable.innerHTML = `<tr>
          <td class="text-center w-100"> Aun no tienes productos. <br> Agrega productos a la
              venta   🛍
          </td>
      </tr>`;
      total = 0;
      subTotal = 0;

      updateQuoteTotals();
      validateDiscount();

      return;
    }

    let tableBody = "";
    shoppingCart.forEach((product, index) => {
      tableBody += `<tr>
          <td style="white-space:normal"> 
            ${product.quantity} x  ${product.productName}
          </td>
          <td class="text-center">$${product.total.toFixed(2)}</td>
          <td> <button type="button"
                  class="btn btn-sm btn-outline-secondary text-info add" data-index="${index}"  data-id="${
        product._id
      }"  ><i class="uil uil-plus add "></i></button>
              <button type="button"
                  class="btn btn-sm btn-outline-secondary text-danger remove" data-index="${index}"  data-id="${
        product._id
      }"><i class="uil uil-minus remove"></i></button>
          </td>
      </tr>`;
    });

    cartProductTable.innerHTML = tableBody;
    updateQuoteTotals();
    validateDiscount();
  }

  function updateQuoteTotals() {
    subTotal = 0;

    //Get discount
    let discount = document.querySelector("#discount").value;
    discount = discount != undefined && discount != "" ? discount : 0;

    //Gets elements from the product and service cart
    shoppingCart.forEach((prod) => (subTotal += parseFloat(prod.total)));
    servicesCart.forEach((serv) => (subTotal += parseFloat(serv.total)));

    //Checkk if extra has a value and if so, is added to the subtotal
    subTotal = !isNaN(parseFloat(extraInput.value))
      ? parseFloat(subTotal) + parseFloat(extraInput.value)
      : parseFloat(subTotal);

    //Calculate the total by sustrating the discount minus the subtotal
    total = parseFloat(subTotal) - parseFloat(discount);

    //Sets the subtotal and total to their dom elements
    document.querySelector("#subTotal").innerHTML = `$${parseFloat(
      subTotal
    ).toFixed(2)}`;
    document.querySelector("#total").innerHTML = `$${parseFloat(total).toFixed(
      2
    )}`;
  }

  //Adds services to the serivice cart
  function addService(service) {
    console.log(service);
    if (servicesCart.length == 0) {
      servicesCart.push({
        id: 1,
        description: service.description,
        total: service.totalService,
      });
    } else {
      servicesCart.push({
        id: servicesCart.length + 1,
        description: service.description,
        total: service.totalService,
      });
    }
    populateSeriviceTable();
  }

  //Fill serviceTable
  function populateSeriviceTable() {
    if (servicesCart.length == 0) {
      cartServiceTable.innerHTML = `<tr>
        <td class="text-center w-100"> Aun no tienes servicios. <br> Agrega servicios a la
            venta   🛒
        </td>
    </tr>`;

      updateQuoteTotals();
      validateDiscount();

      return;
    }

    let tableBody = "";
    servicesCart.forEach((service, index) => {
      tableBody += `<tr>
        <td style="white-space:normal"> 
          ${service.description}
        </td>
        <td class="text-center">$${parseFloat(service.total).toFixed(2)}</td>
        <td class="text-center"> 
            <button type="button"
                class="btn btn-sm btn-outline-secondary text-danger remove" data-index="${index}"  data-id="${
        service._id
      }"><i class="uil uil-multiply remove"></i></button>
        </td>
    </tr>`;
    });

    cartServiceTable.innerHTML = tableBody;
    updateQuoteTotals();
    validateDiscount();
  }

  //Validators
  //Prevent the discount to be greater than the sale
  function validateDiscount() {
    let subTotal = document.querySelector("#subTotal").innerHTML;
    let discount = document.querySelector("#discount");
    let discountMsg = document.querySelector("#discountMsg");
    //checks if subtotal has a '$' and if so removes it to get the number
    subTotal = subTotal.includes("$")
      ? subTotal.substr(1, subTotal.length - 1)
      : subTotal;

    //Check if the total is and number
    subTotal = isNaN(parseFloat(subTotal)) ? 0 : parseFloat(subTotal);

    //checks if the subtotal is less than the discount
    if (
      subTotal - (discount.value ?? 0) < 0 ||
      isNaN(subTotal - (discount.value ?? 0))
    ) {
      discountMsg.innerHTML =
        "El subtotal menos el descuento no debe ser menor a 0.";
      discount.classList.add("border", "border-danger");
      updateQuoteTotals();
      return false;
    } else {
      discountMsg.innerHTML = "";
      discount.classList.remove("border", "border-danger");
      updateQuoteTotals();

      return true;
    }
  }

  function validateExtra() {
    validateDiscount();
  }

  //Modals
  function showServiceModalBtnClicked() {
    showServiceModal();
  }

  function showServiceModal() {
    document.querySelector("#modal_title").innerHTML = "Agregar servicio";
    $("#main_modal").modal("show");
  }

  $("#main_modal").on("hidden.bs.modal", function (e) {
    resetServiceFormValidation();
    resetForm("serviceForm");
  });

  function populateTableWithQuoteInfo() {
    detalleCotizacion.forEach((prod) => {
      shoppingCart.push({
        id: prod.productID._id,
        productName: prod.productID.name,
        unitPrice: prod.unitPrice,
        quantity: prod.quantity,
        total: prod.unitPrice * prod.quantity,
        totalStock: prod.productID.quantity,
      });
    });

    detalleServicio.forEach((serv) => {
      servicesCart.push({
        id: serv._id,
        description: serv.description,
        total: serv.total,
      });
    });

    populateProductTable();
    populateSeriviceTable();
  }

  //Initial Actions
  let productsTable = new CardTable(
    "productsTable",
    productsData,
    "btnNext",
    "btnPrev",
    "pageCounter",
    "6",
    false
  );
  productsTable.reloadCardTable(productsData);

  populateTableWithQuoteInfo();
});
