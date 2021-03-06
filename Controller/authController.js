const User = require("../Model/UserModel");
const { redisDelete } = require("../Utils/Helpers/redisHelper");
const fs = require("fs");
const path = require("path");
const errorHandler = require("../Utils/Helpers/errorHandler");

const SibApiV3Sdk = require("sib-api-v3-sdk");
const defaultClient = SibApiV3Sdk.ApiClient.instance;

const index = (req, res) => {
  /* res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache"); */

  res.render("login", {
    script: "loginClient",
  });
};

const logInUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();

    req.session.key = token;

    return res.json({
      error: false,
      message: "Acceso correcto.",
      response: {
        user,
        token,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.json({
      error: true,
      message: error.message,
      response: null,
    });
  }
};

const logOutUser = async (req, res) => {
  let session = req.sessionID;

  redisDelete(`sess:${session}`);
  req.session.destroy();

  res.redirect("/login");
};

const recoverPassword = (req, res) => {
  res.render("recoverPassword", {});
};

const sendRecoveryPasswordEmail = async (req, res) => {
  const { email } = req.body;

  try {
    let user = await User.findUserByEmail(email);
    let nameForMail = `${user.name.split(" ")[0]} ${user.fatherSurname}`;
    let token = await user.generatePasswordRecoveryToken();
    let link = `${req.protocol}://${req.get(
      "host"
    )}/changePassword?token=${token}`;

    var apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = process.env.SENDINBLUE_API_KEY;
    var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail = {
      sender: {
        name: process.env.BUSINESS_NAME,
        email: process.env.BUSINESS_EMAIL,
      },
      to: [
        {
          email: user.email,
          name: nameForMail,
        },
      ],
      subject: "Solicitud de cambio de contraseña",
      htmlContent: renderMailHtml(nameForMail, link),
      headers: {
        accept: "application/json",
        "api-key": `xkeysib-${process.env.SENDINBLUE_API_KEY}`,
        "content-type": "application/json",
      },
    };

    apiInstance.sendTransacEmail(sendSmtpEmail).then(
      function (data) {
        return res.json({
          error: false,
          message:
            "Correo enviado correctamente. Revisa tu correo para continuar con el proceso de cambio de contraseña. No olvides revisar los correos no deseados (spam).",
          response: null,
        });
      },
      function (error) {
        console.error(error);
        return res.json({
          error: true,
          message: error.message,
          response: null,
        });
      }
    );
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
      response: null,
    });
  }
};

const setNewPasswordView = (req, res) => {
  res.render("setNewPassword", {});
};

const changePassword = async (req, res) => {
  let { pw } = req.body;

  try {
    req.user.password = pw;
    await req.user.save();

    res.json({
      error: false,
      message: "La contraseña fue actualizada correctamente",
      response: null,
    });
  } catch (error) {
    let errors = errorHandler(error);
    console.log(error);
    if (errors.length === 0) {
      res.json({
        error: true,
        message: error.message,
        response: null,
      });
    } else {
      res.json({
        error: true,
        message: errors,
        response: null,
      });
    }
  }
};

const renderMailHtml = (user, link) => {
  let logoImg = fs
    .readFileSync(path.join(__dirname, `../Public/images/logo/logo.png`))
    .toString("base64");

  const html = `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <style>
        .custom-card {
          min-width: 0;
          word-wrap: break-word;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 0.375rem;
          background-color: #fff;
          background-clip: border-box;
          margin-bottom: 30px;
          border: 0;
          box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.15);
        }
  
        .container {
          width: 100%;
          margin-right: auto;
          margin-left: auto;
          padding-right: 15px;
          padding-left: 15px;
        }

        *{
          font-family: Arial,Helvetica, sans-serif,sans-serif; color: #3c4858;
        }

      </style>
    </head>
  
    <body>
      <div class="container">
        <div class="card">
          <div class="card-body" style="padding-bottom: 0">
            <div style="width: 100%; text-align: center">
              <img
              src="data:image/png;base64,${logoImg}"
                style="max-height: 100px"
                srcset=""
              />
              <h1>Solicitud de cambio de contraseña</h1>
            </div>
  
            <hr style="margin-top: 0px; margin-bottom: 5px" />
  
            <div style="width: 100%; text-align: center">
              <h2>¡Recibiste un nuevo correo!</h2>
              <h3>
                ¡Hola ${user}! Acabas de solicitar un cambio de contraseña. Para
                poder cambiarla haz click en el botón.
              </h3>
              <div
                class=""
                style="
                  text-align: center;
                  margin-left: auto;
                  margin-right: auto;
                  margin-bottom: 20px;
                  cursor: pointer !important
                "
              >
                <a href="${link}" style="cursor: pointer !important">
                  <button
                    style="
                      border-radius: 10px;
                      height: 50px;
                      color: white !important;
                      background-color: #5e72e4;
                      border-color: #5e72e4;
                      border: none;
                      padding: 15px 32px;
                      text-align: center;
                      text-decoration: none;
                      display: inline-block;
                      border: none;
                      margin: 4px 2px;
                      cursor: pointer !important;
                    "
                  >
                    <h4 style="margin: 0; color: white !important; cursor: pointer !important">
                      Cambiar contraseña
                    </h4>
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;

  return html;
};

module.exports = {
  index,
  logInUser,
  logOutUser,
  recoverPassword,
  sendRecoveryPasswordEmail,
  setNewPasswordView,
  changePassword,
};
