export const getPaymentMailHtml = (
  currency: string,
  payout: number,
  url: string,
): string => {
  return `
      <!doctype html>
      <html lang="en">
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>PrivateDrops Email</title>
            <style media="all" type="text/css">
              body {
              font-family: Helvetica, sans-serif;
              -webkit-font-smoothing: antialiased;
              font-size: 16px;
              line-height: 1.3;
              }
              table {
              border-collapse: separate;
              width: 100%;
              }
              table td {
              font-family: Helvetica, sans-serif;
              font-size: 16px;
              vertical-align: top;
              }
              body {
              background-color: #f4f5f6;
              margin: 0;
              padding: 0;
              }
              .body {
              background-color: #f4f5f6;
              width: 100%;
              }
              .container {
              margin: 0 auto !important;
              max-width: 600px;
              padding: 0;
              padding-top: 24px;
              width: 600px;
              }
              .content {
              box-sizing: border-box;
              display: block;
              margin: 0 auto;
              max-width: 600px;
              padding: 0;
              }
              .main {
              background: #ffffff;
              border: 1px solid #eaebed;
              border-radius: 16px;
              width: 100%;
              }
              .wrapper {
              box-sizing: border-box;
              padding: 24px;
              }
              .footer {
              clear: both;
              padding-top: 24px;
              text-align: center;
              width: 100%;
              }
              p {
              margin: 0;
              margin-bottom: 16px;
              }
              a {
              color: #0867ec;
              text-decoration: underline;
              }
              .btn {
              box-sizing: border-box;
              min-width: 100% !important;
              width: 100%;
              }
              .btn table {
              width: auto;
              }
              .btn table td {
              background-color: #ffffff;
              border-radius: 4px;
              text-align: center;
              }
              .btn a {
              background-color: #ffffff;
              border: solid 2px #0867ec;
              border-radius: 4px;
              box-sizing: border-box;
              color: #0867ec;
              cursor: pointer;
              display: inline-block;
              font-size: 16px;
              font-weight: bold;
              padding: 12px 24px;
              text-decoration: none;
              text-transform: capitalize;
              }
              .btn-primary table td {
              background-color: #0867ec;
              }
              .btn-primary a {
              background-color: #0867ec;
              border-color: #0867ec;
              color: #ffffff;
              }
              @media all {
              .btn-primary table td:hover {
              background-color: #ec0867 !important;
              }
              .btn-primary a:hover {
              background-color: #ec0867 !important;
              border-color: #ec0867 !important;
              }
              }
            </style>
        </head>
        <body>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
              <tr>
                  <td>&nbsp;</td>
                  <td class="container">
                    <div class="content">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="main">
                          <tr>
                              <td class="wrapper">
                                <p>Hi,</p>
                                <p>We are excited to inform you that someone has just seen your media and you earned <b>${(
                                  payout / 100
                                ).toFixed(2)} ${currency}</b>!</p>
                                <p>You can view your updated account balance here:</p>
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
                                    <tbody>
                                      <tr>
                                          <td align="left">
                                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                                <tbody>
                                                  <tr>
                                                      <td> <a href="${url}" target="_blank">View Account</a> </td>
                                                  </tr>
                                                </tbody>
                                            </table>
                                          </td>
                                      </tr>
                                    </tbody>
                                </table>
                                <br />
                                <p>or if the button doesn't work, copy and paste the following URL into your browser:</p>
                                <p><a href="${url}">${url}</a></p>
                                <p>Thank you for using our services!</p>
                              </td>
                          </tr>
                        </table>
                        <div class="footer">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td class="content-block">
                                    <span class="apple-link">A solution developed by Impossible Labs ltd</span>
                                </td>
                              </tr>
                          </table>
                          <br />
                        </div>
                    </div>
                  </td>
                  <td>&nbsp;</td>
              </tr>
            </table>
        </body>
      </html>
  `;
};
