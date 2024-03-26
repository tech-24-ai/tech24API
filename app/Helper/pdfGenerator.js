let fs = require("fs");
const puppeteer = require("puppeteer");
const { HTML_KEY } = require("./constants");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const _ = require("lodash");
const { sendMail } = require("./sendMail");
const Invoice = use("App/Models/Invoice");
const Euinvoice = use("App/Models/Admin/VisitorSubscriptionModule/Euinvoice");
const Eusubcription = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuSubcription"
);
const Purchase = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuDocPurchase"
);
const BookingHistory = use("App/Models/Admin/ConsultantModule/BookingHistory");
const BookingTransactionHistory = use(
  "App/Models/Admin/ConsultantModule/BookingTransactionHistory"
);
const CreditPurchaseDetail = use(
  "App/Models/Admin/ConsultantModule/CreditPurchaseDetail"
);
const moment = require("moment");
const Subcription = use("App/Models/Subcription");
const MISegment = use("App/Models/Admin/MISegmentModule/MISegment");
const VendorKeyPerson = use("App/Models/Admin/VendorModule/VendorKeyPeoples");
const VendorFundingList = use(
  "App/Models/Admin/VendorModule/VendorFundingList"
);
const VendorAcquisitionLists = use(
  "App/Models/Admin/VendorModule/VendorAcquisitionLists"
);
const VendorPatentList = use("App/Models/Admin/VendorModule/VendorPatentList");
const VendorFinancial = use("App/Models/VendorFinancial");

async function getInnerHtml(type = "GENERAL_INFO", id, data) {
  switch (type) {
    case "GENERAL_INFO":
      return {
        innerHtml: "general_info.html",
        keys: HTML_KEY[type],
        result: await getGeneralInfo(id),
      };
    case "EXECUTIVE_MANAGEMENT":
      return {
        innerHtml: "executive_management.html",
        keys: HTML_KEY[type],
        result: await getExecutivePeople(id, true),
      };
    case "KEY_PEOPLE":
      return {
        innerHtml: "executive_management.html",
        keys: HTML_KEY[type],
        result: await getExecutivePeople(id, false),
      };
    case "INVOICE":
      return {
        innerHtml: "invoice.html",
        keys: HTML_KEY[type],
        result: await getInvoiceDetails(id),
      };
    case "EUINVOICE":
      return {
        innerHtml: "euinvoice.html",
        keys: HTML_KEY[type],
        result: await getEuInvoiceDetails(id),
      };
    case "EUBOOKING_RECEIPT":
      return {
        innerHtml: "schedule_booking.html",
        keys: HTML_KEY[type],
        result: await getEuInvoiceDetails(id),
      };
    case "FUNDING_DETAILS":
      return {
        innerHtml: "funding_details.html",
        keys: HTML_KEY[type],
        result: await getFundingDetails(id),
      };
    case "ACQUISITIONS":
      return {
        innerHtml: "acquisitions.html",
        keys: HTML_KEY[type],
        result: await getAcquisitions(id),
      };
    case "PATENTS":
      return {
        innerHtml: "patents.html",
        keys: HTML_KEY[type],
        result: await getPatents(id),
      };
    case "ADD_INFO":
      return {
        innerHtml: "add_info.html",
        keys: HTML_KEY[type],
        result: await getAddInfo(id, data),
      };
    default:
      break;
  }
}
function mapKeys(type, keys, data, html, filter) {
  if (type === "INVOICE") {
    html = invoiceMapping(keys, data, html);
  }

  if (type === "EXECUTIVE_MANAGEMENT" || type == "KEY_PEOPLE") {
    html = mapPeople(keys, data, html);
  }
  if (type === "FUNDING_DETAILS") {
    html = mapFundingDetails(keys, data, html);
  }
  if (type === "ACQUISITIONS") {
    html = mapAcquisitions(keys, data, html);
  }
  if (type === "PATENTS") {
    html = mapPatents(keys, data, html);
  }
  if (type === "ADD_INFO") {
    html = mapAddInfo(keys, data, html, filter);
  }
  keys.forEach((x) => {
    console.log(x);
    html = html.replace(x.key, _.get(data, x.field));
  });
  return html;
}

async function getExecutivePeople(id, executive) {
  const query = VendorKeyPerson.query();
  query.where("vendor_id", id);
  query.where("is_executive_managment", executive);
  const result = (await query.fetch()).toJSON();
  return { result };
}

async function getFundingDetails(id) {
  const query = VendorFundingList.query();
  query.where("vendor_id", id);
  const result = (await query.fetch()).toJSON();
  return { result };
}
async function getAcquisitions(id) {
  const query = VendorAcquisitionLists.query();
  query.where("vendor_id", id);
  const result = (await query.fetch()).toJSON();
  return { result };
}

async function getPatents(id) {
  const query = VendorPatentList.query();
  query.where("vendor_id", id);
  query.limit(10);
  const result = (await query.fetch()).toJSON();
  return { result };
}

async function getAddInfo(id, data) {
  const query = VendorFinancial.query();
  query.where("vendor_id", id);
  if (data.year) query.where("year", year);
  const result = (await query.fetch()).toJSON();
  return { result };
}

async function getGeneralInfo(id) {
  let response = {
    founded: "",
    company_type: "",
    vendor_category_name: "",
    head_quarter: "",
    industry: "",
    specality: "",
  };
  const query = Vendor.query();
  query.where("vendors.id", id);
  query.with("industries");
  query.with("modules");
  query.with("itmap_score");
  query.with("locations.country");
  query.with("vendor_category");
  const query2 = Vendor.query();
  query2.select("countries.name");
  query2.leftJoin("countries", "countries.id", "vendors.main_country");
  const queryResult = await query.firstOrFail();
  const result = await queryResult.toJSON();
  response.founded = result.founded;
  response.company_type = result.company_type;
  response.vendor_category_name = result.vendor_category.name;

  let [location] = result.locations.filter((x) => x.is_headoffice == 1);
  if (location) response.head_quarter = location.country.name;
  response.specality = `${result.modules.map((x) => x.name)}`;
  response.industry = `${result.industries.map((x) => x.name)}`;
  return response;
}

async function getInvoiceDetails(id) {
  let invoiceQuery = Invoice.query();
  invoiceQuery.where({ id });
  let data = await invoiceQuery.fetch();
  let [details] = data.toJSON();
  if (details) {
    let SubcriptionQuery = Subcription.query();
    SubcriptionQuery.where("subcriptions.id", details.subscription_id);
    SubcriptionQuery.with("modules");
    SubcriptionQuery.with("countries");
    SubcriptionQuery.with("regions");
    SubcriptionQuery.with("plans");
    let [subDetails] = (await SubcriptionQuery.fetch()).toJSON();
    let segement = await MISegment.findOrFail(subDetails.plans.segment_id);
    return {
      ...details,
      segment_name: segement.name,
      modules: subDetails.modules.map((x) => x.name),
      countries: subDetails.countries.map((x) => x.name),
      regions: subDetails.regions.map((x) => x.name),
      invoice_date: moment(details.invoice_date).format("YYYY-MM-DD"),
    };
  }
}

async function getEuInvoiceDetails(id) {
  let invoiceQuery = Euinvoice.query();
  invoiceQuery.where({ id });
  let data = await invoiceQuery.fetch();
  let [details] = data.toJSON();
  if (details.type == 1) {
    let SubcriptionQuery = Eusubcription.query();
    SubcriptionQuery.where(
      "itmap_eu_subcriptions.id",
      details.subscription_purchase_id
    );
    SubcriptionQuery.with("plans");
    let [subDetails] = (await SubcriptionQuery.fetch()).toJSON();

    return {
      ...details,
      invoice_amount: details.invoice_amount,
      invoice_type: " Subscription",
      date: moment(details.invoice_date).format("YYYY-MM-DD"),
      plan_name: subDetails.plans.plan_name + " Plan",
      document_name: "",
      invoicedate: moment(details.invoice_date).format("YYYY-MM-DD"),
    };
  } else if (details.type == 3) {
    // booking
    let bookingQuery = BookingHistory.query();
    bookingQuery.where("id", details.booking_history_id);
    bookingQuery.with("timezone", (builder) => {
      builder.select("id", "offset");
    });
    bookingQuery.with("transaction", (builder) => {
      builder.select("paypal_transaction_id", "booking_history_id", "taxes");
    });

    bookingQuery.select(
      "id",
      "visitor_time_zone_id",
      "booking_utc_time",
      "duration",
      "amount_per_hour"
    );
    let [bookingDetails] = (await bookingQuery.fetch()).toJSON();
    const utcOffset = bookingDetails.timezone.offset.replace("UTC", "").trim();
    return {
      ...details,
      invoice_amount: details.invoice_amount,
      amount_per_hour: bookingDetails.amount_per_hour,
      taxes: bookingDetails.transaction.taxes,
      duration: bookingDetails.duration,
      transaction_Id: bookingDetails.transaction.paypal_transaction_id,
      invoice_type: " booking Schedule",
      date: moment
        .parseZone(bookingDetails.booking_utc_time)
        .utcOffset(utcOffset)
        .format("LLL"),
      invoicedate: moment(details.invoice_date).format("YYYY-MM-DD"),
    };
  } else if (details.type == 4) {
    // credit purchase
    // let CreditPurchaseQuery = CreditPurchaseDetail.query();
    // CreditPurchaseQuery.where("id", details.credit_purchase_detail_id);

    // let [purchaseDetails] = (await CreditPurchaseQuery.fetch()).toJSON();
    return {
      ...details,
      invoice_amount: details.invoice_amount,
      invoice_type: " purchasing credits",
      plan_name: "",
      document_name: "",
      date: moment(details.invoice_date).format("YYYY-MM-DD"),
      invoicedate: moment(details.invoice_date).format("YYYY-MM-DD"),
    };
  } else {
    let PurchaseQuery = Purchase.query();

    PurchaseQuery.where(
      "itmap_eu_doc_purchases.id",
      details.subscription_purchase_id
    );
    PurchaseQuery.with("documents", (builder) => {
      builder.select(
        "documents.id",
        "documents.name",
        "documents.subscription_category",
        "documents.document_type_id",
        "documents.document_category"
      );
    });

    let [subDetails] = (await PurchaseQuery.fetch()).toJSON();
    return {
      ...details,
      invoice_type: "purchasing the ITMAP Document",
      invoice_amount: details.invoice_amount,
      date: moment(details.invoice_date).format("YYYY-MM-DD"),
      plan_name: "",
      document_name: subDetails.documents.name,
      invoicedate: moment(details.invoice_date).format("YYYY-MM-DD"),
    };
  }
}

async function getBookingDetails(id) {
  let invoiceQuery = Euinvoice.query();
  invoiceQuery.where({ id, type: 3 });
  let data = await invoiceQuery.fetch();
  let [details] = data.toJSON();
  let bookingQuery = BookingHistory.query();
  bookingQuery.where({ id });
  // let data = await bookingQuery.fetch();
  // let [details] = data.toJSON();
  return {
    ...details,
    invoice_amount: details.invoice_amount,
    invoice_type: " booking schedule",
    date: moment(details.booking_date).format("YYYY-MM-DD"),
  };
}

module.exports.generatePdf = async (
  { type, id, data },
  user = {
    name: "Guest",
    email: "",
    mobile: "",
  }
) => {
  let baseHtml = fs.readFileSync(__dirname + "/templates/base.html", "utf8");
  var userdata = {
    name: user.name,
    email: user.email.length > 0 ? user.email : "",
    mobile: user.mobile.length > 0 ? user.mobile : "",
  };
  let html = "";
  if (type === "IMAGE") {
    return new Buffer(data.base64, "base64");
  } else {
    let { innerHtml, keys, result } = await getInnerHtml(type, id, data);
    html = fs.readFileSync(`${__dirname}/templates/${innerHtml}`, "utf-8");
    html = baseHtml.replace("##INNERHTML##", html);
    if (!result.date) result.date = moment(new Date()).format("YYYY-MM-DD");
    html = mapKeys(
      type,
      [...keys, ...HTML_KEY.BASE],
      { ...result, ...userdata },
      html,
      data
    );
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html);
  // Testing changes
  // const a = await page.content();
  // fs.writeFileSync(__dirname + "/templates/test.html", a);

  const buffer = await page.pdf({
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span style="font-size: 5px;text-align:center;"></span>',
    footerTemplate:
      '<span style="font-size: 5px;"> <span class="pageNumber"></span> of <span class="totalPages"></span></span>',
    margin: { top: 30, bottom: 0, right: 0, left: 0 },
  });
  await browser.close();
  return buffer;
};

module.exports.sendMail = async ({ type, id, data, ispurchase }, user) => {
  let buffer = await this.generatePdf({ type, id, data }, user);
  let title = "Invoice Receipt";
  if (type == "IMAGE") title = data.name;
  let name = user.name;
  var filename = "Subscription_Receipt";
  let details = "";
  if (type == "EUINVOICE" || type == "INVOICE") {
    if (ispurchase) {
      details =
        "Welcome to ITMAP. please find your Invoice Receipt attached for ITMAP Purchase";
      filename = "Purchase_Receipt";
    } else {
      details =
        "Welcome to ITMAP. Please find your Invoice Receipt attached for ITMAP Subscription";
      filename = "Subscription_Receipt";
    }
  } else {
    title = type.replace("_", "") + " Report";
    filename = type.replace("_", "");
    details =
      "Welcome to Market Intelligence. Please find your attachment for Market Intelligence Report";
  }

  sendMail(user.email, title, buffer, `${filename}.pdf`, title, name, details);
};

module.exports.getInvoiceBuffer = async ({ type, id, data }, user) => {
  let buffer = await this.generatePdf({ type, id, data }, user);
  return buffer;
};

function invoiceMapping(keys, data, html) {
  if (data.modules.length) {
    let marketstr = "";
    let index = 0;
    data.modules.forEach((x) => {
      index++;
      marketstr += `${x}, `;
      if (index == 185) {
        marketstr += `<div style="page-break-after:always;margin:5%"></div>`;
      }
      if (index == 600) {
        marketstr += `<div style="page-break-after:always;margin:5%"></div>`;
      }
    });
    let str = marketstr;

    html = html.replace("##MARKET##", str);
  } else {
    html = html.replace("##MARKET##", "");
  }
  if (data.countries.length) {
    let countriesstr = "";
    let index = 0;
    data.countries.forEach((x) => {
      index++;
      countriesstr += `${x}, `;
      if (index == 150) {
        countriesstr += `<div style="page-break-after:always;margin:5%"></div>`;
      }
      if (index == 600) {
        countriesstr += `<div style="page-break-after:always;margin:5%"></div>`;
      }
    });
    let str = countriesstr;

    html = html.replace("##COUNTRY##", str);
  } else {
    html = html.replace("##COUNTRY##", "NA");
  }
  if (data.regions.length) {
    let regionstr = "";
    let index = 0;
    data.regions.forEach((x) => {
      index++;
      regionstr += `${x}, `;
      if (index == 300) {
        regionstr += `<div style="page-break-after:always;margin:5%"></div>`;
      }
      if (index == 600) {
        regionstr += `<div style="page-break-after:always;margin:5%"></div>`;
      }
    });
    let str = regionstr;

    html = html.replace("##REGION##", str);
  } else {
    html = html.replace("##REGION##", "NA");
  }
  return html;
}

function mapPeople(keys, data, html) {
  let text = "";
  data.result.forEach((x) => {
    text += `<tr>
    <td>${x.name}</td>
    <td>${x.designation}</td>
    <td>${x.is_board_of_directors ? "Yes" : "No"}</td>
    </tr>`;
  });
  html = html.replace("##CONTENT##", text);
  return html;
}

function mapFundingDetails(keys, data, html) {
  let text = "";
  data.result.forEach((x) => {
    text += `<tr>
    <td>${x.type_of_funding}</td>
    <td>${x.date_of_funding}</td>
    <td>${x.funding_amount}</td>
    <td>${x.funded_by}</td>
    </tr>`;
  });
  html = html.replace("##CONTENT##", text);
  return html;
}

function mapAcquisitions(keys, data, html) {
  let text = "";
  data.result.forEach((x) => {
    text += `<tr>
    <td>${x.acquired_company_name}</td>
    <td>${moment(x.date_of_acquisition).format("YYYY-MM-DD")}</td>
    <td>${x.acquired_amount}</td>
    </tr>`;
  });
  html = html.replace("##CONTENT##", text);
  return html;
}

function mapPatents(keys, data, html) {
  let text = "";
  data.result.forEach((x) => {
    text += `<tr>
    <td>${x.number}</td>
    <td>${x.title}</td>
    <td>${x.date}</td>
    </tr>`;
  });
  html = html.replace("##CONTENT##", text);
  return html;
}

function mapAddInfo(keys, data, html, filter) {
  if (!filter.year) filter.year = "ALL";
  let text = "";
  text += `<thead><tr>
    <th scope="col"></th>`;
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<th scope="col" className="funding-content-bar">
            ${d.year}
          </th>`;
    }
  });
  text += "</tr></thead>";
  // Net Income
  text += "<tr><td> Net Income</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
            ${d.net_income}
          </td>`;
    }
  });
  text += "</tr>";
  // Net Income
  text += "<tr><td> Net Income</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
              ${d.net_income}
            </td>`;
    }
  });
  text += "</tr>";
  //Total Asset
  text += "<tr><td> Total Assets</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
                ${d.total_assets}
              </td>`;
    }
  });
  text += "</tr>";
  // Total Liabilities
  text += "<tr><td>Total Liabilities</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
            ${d.total_liabilities}
          </td>`;
    }
  });
  text += "</tr>";
  // Total Equity
  text += "<tr><td>Total Equity</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
              ${d.total_equity}
            </td>`;
    }
  });
  text += "</tr>";
  //Gross&nbsp;Profit
  text += "<tr><td>Gross&nbsp;Profit</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
            ${d.gross_profit}
          </td>`;
    }
  });
  text += "</tr>";
  // RD&nbsp;Investment
  text += "<tr><td>RD&nbsp;Investment</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
              ${d.rd_investment}
            </td>`;
    }
  });
  text += "</tr>";
  // Current&nbsp;Debt
  text += "<tr><td>Current&nbsp;Debt</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
            ${d.current_debt}
          </td>`;
    }
  });
  text += "</tr>";
  // Revenue
  text += "<tr><td>Revenue</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
              ${d.revenue}
            </td>`;
    }
  });
  text += "</tr>";
  // TPE&nbsp;Ratio
  text += "<tr><td>TPE&nbsp;Ratio</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
            ${d.p_e_ratio}
          </td>`;
    }
  });
  text += "</tr>";
  // Debt&nbsp;Equity&nbsp;Ratio
  text += "<tr><td>Debt&nbsp;Equity&nbsp;Ratio</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
              ${d.debt_equity_ratio}
            </td>`;
    }
  });
  text += "</tr>";
  // Total&nbsp;Shares
  text += "<tr><td>Total&nbsp;Shares</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
            ${d.total_shares}
          </td>`;
    }
  });
  text += "</tr>";
  // Reported&nbsp;EPS
  text += "<tr><td>Reported&nbsp;EPS</td>";
  data.result.forEach((d) => {
    if (d.quarter === filter.year) {
      text += `<td scope="col" className="funding-content-bar">
              ${d.reported_eps}
            </td>`;
    }
  });
  text += "</tr>";

  html = html.replace("##CONTENT##", text);

  return html;
}
