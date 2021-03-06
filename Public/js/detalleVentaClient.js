window.addEventListener("DOMContentLoaded", () => {
  const routes = {
    delete: "/cancelSale",
    print: "/printSaleDetail",
  };

  const saleID = document.querySelector("#saleId").value;
  const mainTable = document.querySelector(".mainTable");
  const cancelSaleBtn = document.querySelector("#cancelSaleBtn");
  const changeSaleBtn = document.querySelector("#changeSaleBtn");
  const printBtn = document.querySelector("#print");

  console.log(mainTable);
  //Listeners
  cancelSaleBtn.addEventListener("click", cancelConfirmation);
  changeSaleBtn.addEventListener("click", editConfirmation);
  printBtn.addEventListener("click", printSaleReport);

  //Functions

  async function cancelSale(_id) {
    blockElem(mainTable);

    let body = JSON.stringify({ _id });

    try {
      let request = await fetch(`${routes.delete}`, {
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
            messages += `<strong>*${msg}</strong>`;
          });
          unblockElem(mainTable);

          modalAlert("warning", "Aviso", messages);
          return;
        } else {
          unblockElem(mainTable);

          modalAlert(
            "warning",
            "Aviso",
            `<strong>*${json.message}</strong> <br>`
          );
          return;
        }
      }

      modalAlert(
        "success",
        "Aviso ",
        `<strong>${json.message}</strong> <br>`,
        () => {
          window.location = `/ventas/historialVentas`;
        }
      );
    } catch (error) {
      errorNotification(error);
      unblockElem(mainTable);
      console.error(error);
    }
  }

  function cancelConfirmation() {
    confirmationAlert("¿Desea cancelar la venta?", () => {
      cancelSale(saleID);
    });
  }

  function editConfirmation() {
    confirmationAlert("¿Desea editar la venta?", () => {
      window.location = `/ventas/cambio-devolucion/${saleID}`;
    });
  }

  async function printSaleReport(e) {
    let body = JSON.stringify({ _id: saleID });
      blockElem(mainTable);

    try {
      let request = await fetch(routes.print, {
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
          unblockElem(mainTable);

          return;
        } else {
          modalAlert(
            "warning",
            "Aviso",
            `<strong>*${json.message}</strong> <br>`
          );
          unblockElem(mainTable);

          return;
        }
      }

      let byteArray = new Uint8Array(
        atob(json.response)
          .split("")
          .map((char) => char.charCodeAt(0))
      );
      let blob = new Blob([byteArray], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank");

      unblockElem(mainTable);

    } catch (error) {
      unblockElem(mainTable);

      errorNotification("Error interno del servidor");
      console.error(error);
    }
  }
});
