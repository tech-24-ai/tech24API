"use strict";
const axios = use("axios");
const Mail = use("Mail");
const Env = use("Env");
const Database = use("Database");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const Document = use("App/Models/Admin/DocumentModule/Document");
const { generatePdf } = require("../../../../Helper/pdfGenerator");
const { sendMail } = require("../../../../Helper/pdfGenerator");
const { getInvoiceBuffer } = require("../../../../Helper/pdfGenerator");
const { getSerialCode } = require("../../../../Helper/serialNo");
const { EU_SERIAL_CODE } = require("../../../../Helper/constants");
const Invoice = use("App/Models/Admin/VisitorSubscriptionModule/Euinvoice");
const Purchase = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuDocPurchase"
);

const transactionHistory = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuTransactionHistory"
);
const Subcription = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuSubcription"
);
const MarketPlan = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuMarketPlan"
);
const geoip = require("geoip-lite");
const _ = require("lodash");
const moment = require("moment");
const IPLog = use("App/Models/IpLog.js");
const UserLog = use("App/Models/UserLogs.js");
const Config = use("App/Models/Admin/ConfigModule/Config");
class VisitorController {
  async register({ request, auth, response }) {
    const query = new Visitor();
    query.name = request.input("name");
    query.email = request.input("email");
    query.mobile = request.input("mobile");
    query.designation = request.input("designation");
    query.company = request.input("company");
    query.password = request.input("password");

    await query.save();
    const result = await Visitor.findByOrFail("email", query.email);
    let accessToken = await auth.authenticator("visitorAuth").generate(result);

    return response.status(200).send({
      message: "Create successfully",
      data: { data: result, access_token: accessToken },
    });
  }

  async login({ request, auth, response }) {
    const email = request.input("email");
    const password = request.input("password");
    if (await auth.authenticator("visitorAuth").attempt(email, password)) {
      let user = await Visitor.query()
        .where({ email: email, is_blocked: false })
        .first();
      if (user) {
        let accessToken = await auth
          .authenticator("visitorAuth")
          .generate(user);
        const ipAddress = _.split(request.header("X-Forwarded-For"), ",");
        let guest_ip = _.trim(_.first(ipAddress));
        guest_ip =
          guest_ip && guest_ip != ""
            ? guest_ip
            : request.request.socket.remoteAddress;
        let geo = geoip.lookup(guest_ip);

        user.visitor_ip = guest_ip;
        user.visitor_ip_country = geo ? geo.country : null;
        user.visitor_ip_city = geo ? geo.city : null;

        await IPLog.findOrCreate(
          { visitor_id: user.id, ip: guest_ip },
          {
            ip: guest_ip,
            country: geo ? geo.country : "",
            city: geo ? geo.city : "",
            visitor_id: user.id,
          }
        );
        // create user log on 20-09-2022
        await UserLog.create({
          user_id: user.id,
          ip: guest_ip,
          country: geo ? geo.country : null,
          city: geo ? geo.city : null,
          register_from: "Web",
        });

        await user.save();

        const userData = {
          email: user.email,
          name: user.name,
          register_from: user.register_from,
        };

        return response.status(200).send({
          message: "Login successful",
          data: { data: userData, access_token: accessToken },
        });
      } else {
        return response.status(423).send({
          message:
            "Your account has been blocked, Please write to admin at support@itmap.com to get it unblock",
        });
      }
    } else {
      return response
        .status(404)
        .send({ message: "You first need to register!" });
    }
  }

  async linkedInLogin({ request, auth, response }) {
    const authorization_code = request.input("authorization_code");
    const redirect_uri = request.input("redirect_uri");
    const client_id = request.input("client_id");
    const client_secret = request.input("client_secret");
    const url = `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&code=${authorization_code}&redirect_uri=${redirect_uri}&client_id=${client_id}&client_secret=${client_secret}`;
    const ipAddress = _.split(request.header("X-Forwarded-For"), ",");
    let guest_ip = _.trim(_.first(ipAddress));
    guest_ip =
      guest_ip && guest_ip != ""
        ? guest_ip
        : request.request.socket.remoteAddress;

    let geo = geoip.lookup(guest_ip);
    const tokenResult = await axios
      .get(url)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.log(error);
        return null;
      });

    if (tokenResult && tokenResult.access_token) {
      const token = tokenResult.access_token;
      const profileData = await axios
        .all([
          axios.get("https://api.linkedin.com/v2/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(
            "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ])
        .then(
          axios.spread((response1, response2) => {
            return {
              name: `${response1.data.localizedFirstName} ${response1.data.localizedLastName}`,
              email: response2.data.elements[0]["handle~"].emailAddress,
            };
          })
        );

      if (profileData) {
        const checkEmail = await Visitor.findBy("email", profileData.email);

        if (checkEmail) {
          await IPLog.findOrCreate(
            { visitor_id: checkEmail.id, ip: guest_ip },
            {
              ip: guest_ip,
              country: geo ? geo.country : "",
              city: geo ? geo.city : "",
              visitor_id: checkEmail.id,
            }
          );

          // create user log on 20-09-2022
          await UserLog.create({
            user_id: checkEmail.id,
            ip: guest_ip,
            country: geo ? geo.country : null,
            city: geo ? geo.city : null,
            register_from: "Linkedin",
          });

          let accessToken = await auth
            .authenticator("visitorAuth")
            .generate(checkEmail);
          return response.status(200).send({
            message: "Login successful",
            data: { data: checkEmail, access_token: accessToken },
          });
        } else {
          const query = new Visitor();
          query.visitor_group_id = 1;
          query.name = profileData.name;
          query.email = profileData.email;
          query.mobile = "";
          query.designation = "";
          query.company = "";
          query.password = "";
          query.register_from = "Linkedin";
          query.visitor_ip = guest_ip;
          query.visitor_ip_country = geo ? geo.country : "";
          query.visitor_ip_city = geo ? geo.city : "";
          await query.save();
          const result = await Visitor.findBy("email", profileData.email);

          await IPLog.Create({
            ip: guest_ip,
            country: geo ? geo.country : null,
            city: geo ? geo.city : null,
            visitor_id: result.id,
          });
          // create user log on 20-09-2022
          await UserLog.create({
            user_id: result.id,
            ip: guest_ip,
            country: geo ? geo.country : null,
            city: geo ? geo.city : null,
            register_from: "Linkedin",
          });

          let accessToken = await auth
            .authenticator("visitorAuth")
            .generate(result);

          this.sendAdminMail(
            profileData,
            guest_ip,
            query.visitor_ip_country,
            query.visitor_ip_city
          );
          return response.status(200).send({
            message: "Login successful",
            data: { data: result, access_token: accessToken },
          });
        }
      }
    }
  }

  async guest_user({ request, auth, response }) {
    const ipAddress = _.split(request.header("X-Forwarded-For"), ",");
    let guest_ip = _.trim(_.first(ipAddress));
    guest_ip =
      guest_ip && guest_ip != ""
        ? guest_ip
        : request.request.socket.remoteAddress;

    let geo = geoip.lookup(guest_ip);
    let user = await Visitor.findOrCreate(
      {
        visitor_ip: guest_ip,
      },
      {
        name: "Guest",
        visitor_ip: guest_ip,
        visitor_ip_country: geo ? geo.country : "",
        visitor_ip_city: geo ? geo.city : "",
        email: `${guest_ip}@guest.com`,
      }
    );
    // let accessToken = await auth.authenticator("guestAuth").generate(user);
    return response.status(200).send({
      message: "Guest Session Created",
      data: { data: user },
    });
  }

  async companysizes({ response }) {
    const query = Visitor.query();

    //Only Valid Company
    query.whereRaw(`company_size is not null`);

    query.groupBy("company_size");
    query.distinct("company_size");
    var result = await query.fetch();

    return response.status(200).send(result);
  }

  async getCompanysizes({ response, auth }) {
    const query = Visitor.query();

    //Only Valid Company
    query.whereRaw(`company_size is not null`);

    query.groupBy("company_size");
    query.distinct("company_size");
    var result = await query.fetch();

    return response.status(200).send(result);
  }

  async getInvoiceNumber({ request, response, auth }) {
    const invoiceQuery = Invoice.query();
    invoiceQuery.where(
      "subscription_purchase_id",
      request.input("subscription_purchase_id")
    );
    invoiceQuery.where("type", request.input("type"));

    const data = await invoiceQuery.fetch();
    return response.status(200).send(data);
  }

  async getsubscription({ request, response, auth }) {
    const query = Subcription.query();
    query.whereRaw(
      `user_id = (?) AND is_active IN (0,1,2) AND status IN ('Pending','Approved')`,
      [auth.user.id]
    );
    query.with("plans", (builder) => {
      builder.select(
        "id",
        "plan_name",
        "plan_duration",
        "is_active",
        "plan_category"
      );
    });
    query.with("transactions", (builder) => {
      builder.select(
        "id",
        "transaction_code",
        "transaction_status",
        "payment_transaction_id"
      );
    });

    const result = await query.fetch();

    if (result && result.size() > 0) {
      return response.status(200).send(result);
    } else {
      const newquery = await Subcription.create({
        user_id: auth.user.id,
      });
      //Add New subscription details
      newquery.created_by = 0;
      newquery.updated_by = 0;
      newquery.is_active = true;
      newquery.plan_id = 1; //Active
      newquery.status = "Approved";
      newquery.subcription_code = await getSerialCode(
        EU_SERIAL_CODE.SUBSCRIPTION
      );
      // newquery.user_id = auth.user.id;

      newquery.subscription_start_date = moment().format("yyyy-MM-DD");
      newquery.subscription_end_date =
        moment().add(365, "days").format("yyyy-MM-DD") + " 23:59:59.000";

      await newquery.save();
      const visitor = await auth.authenticator("visitorAuth").getUser();
      await this.sendInvoice(newquery.id, null, visitor, 1, 1);
      const query = Subcription.query();
      query.whereRaw(
        `user_id = (?) AND is_active IN (0,1,2) AND status IN ('Pending','Approved')`,
        [auth.user.id]
      );
      query.with("plans");
      query.with("transactions");

      const result = await query.fetch();
      return response.status(200).send(result);
    }
  }

  async testfunc({ request, response, auth }) {
    return response.status(200).send("success");
  }

  async createPdf({ request, response, auth }) {
    let user = undefined;
    try {
      user = await auth.authenticator("visitorAuth").getUser();
      user = user.toJSON();
    } catch (ex) {}
    var body = request.only(["type", "id", "data"]);
    let data = await generatePdf(body, user);
    return response.send(data);
  }

  async checkPurchase({ auth, request, response }) {
    const query = Purchase.query();
    query.whereRaw(`user_id = (?) AND document_id = (?)`, [
      auth.user.id,
      request.input("document_id"),
    ]);
    query.with("transactions");
    const result = await query.fetch();

    const templatetoolkitlimit = await Config.query()
      .where("key", "TemplateToolkitPurchaseLimit")
      .pluck("value");

    const fromDate = moment().subtract(1, "years").format("yyyy-MM-DD");
    const query2 = Purchase.query();
    // query2.whereRaw(`user_id=(?) AND purchase_date >= (?)`, [
    //   auth.user.id,
    //   fromDate,
    // ]);
    query2.whereRaw(
      `user_id = (?) AND (timediff(now(), created_at) < CAST('24:00:00' AS time))`,
      [auth.user.id]
    );

    const result2 = await query2.fetch();
    if (result2.size() >= templatetoolkitlimit) {
      return response.status(200).send({
        message:
          "You have reached the daily limit to purchase reports. Please revisit in 24 hours to purchase again.",
        type: "alert",
      });
    }

    if (result.size() > 0) {
      return response.status(200).send(result);
    } else {
      return response.status(200).send({ message: "No Document found" });
    }
  }

  async addSubscription({ request, response, auth }) {
    const trx = await Database.beginTransaction();
    try {
      var is_active = 1;
      let cursubsid = 1;
      const query = await Subcription.create({ user_id: auth.user.id }, trx);

      //Make existing subscription inactive first
      const subquery = Subcription.query(trx);

      subquery.whereRaw(`user_id = (?) AND is_active = (1)`, [auth.user.id]);

      const result = await subquery.first(trx);

      if (result && result.id > 0) {
        var sub_end_date = moment(result.subscription_end_date);
        cursubsid = result.plan_id;
        var cur_date = moment();

        if (cur_date > sub_end_date) {
          //subscription ended

          query.subscription_start_date = moment().format("yyyy-MM-DD");
          query.subscription_end_date =
            moment().add(365, "days").format("yyyy-MM-DD") + " 23:59:59.000";
        } else {
          const subquery = Subcription.query();

          subquery.whereRaw(`user_id = (?) AND is_active = (?)`, [
            auth.user.id,
            2,
          ]);

          const subfutureresult = await subquery.first(trx);

          if (subfutureresult && subfutureresult.id > 0) {
            return response.status(423).send({
              message:
                "You already have future subscription, can't apply for any more future subscrition",
            });
          } else {
            if (result.plan_id == request.input("plan_id")) {
              is_active = 2;

              query.subscription_start_date =
                moment(result.subscription_end_date)
                  .add(1, "days")
                  .format("yyyy-MM-DD") + " 23:59:59.000";

              query.subscription_end_date =
                moment(result.subscription_end_date)
                  .add(365, "days")
                  .format("yyyy-MM-DD") + " 23:59:59.000";
            } else {
              is_active = 0;

              query.subscription_start_date = moment().format("yyyy-MM-DD");
              query.subscription_end_date =
                moment().add(365, "days").format("yyyy-MM-DD") +
                " 23:59:59.000";
            }
          }
        }
      } else {
        query.subscription_start_date = moment().format("yyyy-MM-DD");
        query.subscription_end_date =
          moment().add(365, "days").format("yyyy-MM-DD") + " 23:59:59.000";
      }

      const transactionHistoryQuery = new transactionHistory(trx);

      //Add transaction details
      if (request.input("transaction")) {
        let transaction = JSON.parse(request.input("transaction"));

        let transcation_details = JSON.parse(transaction.transcation_details);

        if (transaction.payment_transcation_id != transcation_details.id)
          query.paypal_subscription_id = transcation_details.id;

        transactionHistoryQuery.payment_transaction_id =
          transaction.payment_transcation_id;
        transactionHistoryQuery.transaction_status =
          transaction.transcation_status;
        transactionHistoryQuery.transaction_amount =
          transaction.transcation_amount;
        transactionHistoryQuery.transaction_details =
          transaction.transcation_details;
        transactionHistoryQuery.transaction_date = transaction.transcation_date;
        transactionHistoryQuery.payment_type = transaction.type;
        transactionHistoryQuery.created_by = 0;
        transactionHistoryQuery.user_id = auth.user.id;
        transactionHistoryQuery.transaction_code = await getSerialCode(
          EU_SERIAL_CODE.TRANSACTION
        );

        await transactionHistoryQuery.save(trx);

        query.payment_transaction_id = transactionHistoryQuery.id;
      }
      if (
        transactionHistoryQuery.transaction_status == "COMPLETED" ||
        transactionHistoryQuery.transaction_status == "ACTIVE"
      ) {
        //Add New subscription details
        query.created_by = 0;
        query.updated_by = 0;
        query.is_active = is_active;
        query.status = request.input("plan_id") == 1 ? "Approved" : "Pending";
        query.remarks = "Approval pending from Admin side";
        query.plan_id = request.input("plan_id");
        query.subcription_code = await getSerialCode(
          EU_SERIAL_CODE.SUBSCRIPTION
        );
        await query.save(trx);
        await trx.commit();
        const visitor = await auth.authenticator("visitorAuth").getUser();
        let invoice = {};
        if (cursubsid != query.plan_id) {
          invoice = await this.sendInvoice(
            query.id,
            transactionHistoryQuery,
            visitor,
            1,
            0
          );
        } else {
          invoice = await this.sendInvoice(
            query.id,
            transactionHistoryQuery,
            visitor,
            1,
            1
          );
        }

        let attachment = await getInvoiceBuffer(
          { type: "EUINVOICE", id: invoice.id },
          visitor
        );

        this.sendAdminSubscriptionMail(
          visitor,
          transactionHistoryQuery,
          query,
          attachment
        );
        this.sendClientSubscriptionMail(
          visitor.id,
          "New Subscription",
          "Thank you for subscribing. Your Subscription has been sent to Admin for Approval."
        );

        return response
          .status(200)
          .send({ message: "Created successfully", result: query, invoice });
      } else {
        return response
          .status(200)
          .send({ message: "PayPal Transaction failed" });
      }
    } catch (error) {
      await trx.rollback();
      console.log(error);
      return response.status(423).send({
        message: "Something went wrong",
        error,
      });
    }
  }

  async addSubscriptionOld({ request, response, auth }) {
    try {
      var is_active = 1;
      let cursubsid = 1;
      const query = await Subcription.create({
        user_id: auth.user.id,
      });

      //Make existing subscription inactive first
      const subquery = Subcription.query();

      subquery.whereRaw(`user_id = (?) AND is_active = (1)`, [auth.user.id]);

      const result = await subquery.first();

      if (result && result.id > 0) {
        var sub_end_date = moment(result.subscription_end_date);
        cursubsid = result.plan_id;
        var cur_date = moment();

        if (cur_date > sub_end_date) {
          //subscription ended

          result.is_active = 0;

          result.subscription_end_date =
            moment().subtract(1, "days").format("yyyy-MM-DD") + " 23:59:59.000";
          await result.save();

          query.subscription_start_date = moment().format("yyyy-MM-DD");
          query.subscription_end_date =
            moment().add(365, "days").format("yyyy-MM-DD") + " 23:59:59.000";
        } else {
          const subquery = Subcription.query();

          subquery.whereRaw(`user_id = (?) AND is_active = (?)`, [
            auth.user.id,
            2,
          ]);

          const subfutureresult = await subquery.first();

          if (subfutureresult && subfutureresult.id > 0) {
            return response.status(423).send({
              message:
                "You already have future subscription, can't apply for any more future subscrition",
            });
          } else {
            if (result.plan_id == request.input("plan_id")) {
              is_active = 2;

              query.subscription_start_date =
                moment(result.subscription_end_date)
                  .add(1, "days")
                  .format("yyyy-MM-DD") + " 23:59:59.000";

              query.subscription_end_date =
                moment(result.subscription_end_date)
                  .add(365, "days")
                  .format("yyyy-MM-DD") + " 23:59:59.000";
            } else {
              is_active = 1;
              result.is_active = 0;

              result.subscription_end_date =
                moment().subtract(1, "days").format("yyyy-MM-DD") +
                " 23:59:59.000";
              await result.save();

              query.subscription_start_date = moment().format("yyyy-MM-DD");
              query.subscription_end_date =
                moment().add(365, "days").format("yyyy-MM-DD") +
                " 23:59:59.000";
            }
          }
        }
      } else {
        query.subscription_start_date = moment().format("yyyy-MM-DD");
        query.subscription_end_date =
          moment().add(365, "days").format("yyyy-MM-DD") + " 23:59:59.000";
      }

      const transactionHistoryQuery = new transactionHistory();

      //Add transaction details
      if (request.input("transaction")) {
        let transaction = JSON.parse(request.input("transaction"));

        let transcation_details = JSON.parse(transaction.transcation_details);

        if (transaction.payment_transcation_id != transcation_details.id)
          query.paypal_subscription_id = transcation_details.id;

        transactionHistoryQuery.payment_transaction_id =
          transaction.payment_transcation_id;
        transactionHistoryQuery.transaction_status =
          transaction.transcation_status;
        transactionHistoryQuery.transaction_amount =
          transaction.transcation_amount;
        transactionHistoryQuery.transaction_details =
          transaction.transcation_details;
        transactionHistoryQuery.transaction_date = transaction.transcation_date;
        transactionHistoryQuery.payment_type = transaction.type;
        transactionHistoryQuery.created_by = 0;
        transactionHistoryQuery.user_id = auth.user.id;
        transactionHistoryQuery.transaction_code = await getSerialCode(
          EU_SERIAL_CODE.TRANSACTION
        );

        await transactionHistoryQuery.save();

        query.payment_transaction_id = transactionHistoryQuery.id;
      }

      if (
        transactionHistoryQuery.transaction_status == "COMPLETED" ||
        transactionHistoryQuery.transaction_status == "ACTIVE"
      ) {
        //Add New subscription details
        query.created_by = 0;
        query.updated_by = 0;
        query.is_active = is_active;
        query.status = request.input("plan_id") == 1 ? "Approved" : "Pending";
        query.plan_id = request.input("plan_id");
        query.subcription_code = await getSerialCode(
          EU_SERIAL_CODE.SUBSCRIPTION
        );
        query.user_id = auth.user.id;

        await query.save();
        const visitor = await auth.authenticator("visitorAuth").getUser();

        let invoice = {};
        if (cursubsid != query.plan_id) {
          invoice = await this.sendInvoice(
            query.id,
            transactionHistoryQuery,
            visitor,
            1,
            0
          );
        } else {
          invoice = await this.sendInvoice(
            query.id,
            transactionHistoryQuery,
            visitor,
            1,
            1
          );
        }

        let attachment = await getInvoiceBuffer(
          { type: "EUINVOICE", id: invoice.id },
          visitor
        );

        this.sendAdminSubscriptionMail(
          visitor,
          transactionHistoryQuery,
          query,
          attachment
        );
        this.sendClientSubscriptionMail(
          visitor.id,
          "Subscription Plan",
          "Thank you for subscribing. Your Subscription has been sent to Admin for Approval."
        );

        return response
          .status(200)
          .send({ message: "Created successfully", result: query, invoice });
      } else {
        return response
          .status(200)
          .send({ message: "PayPal Transaction failed" });
      }
    } catch (error) {
      console.log(error);
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async addPurchase({ request, response, auth }) {
    try {
      const query = await Purchase.create();

      const transactionHistoryQuery = new transactionHistory();
      //Add transaction details
      if (request.input("transaction")) {
        let transaction = JSON.parse(request.input("transaction"));

        transactionHistoryQuery.payment_transaction_id =
          transaction.payment_transcation_id;
        transactionHistoryQuery.transaction_status =
          transaction.transcation_status;

        transactionHistoryQuery.transaction_amount =
          transaction.transcation_amount;
        transactionHistoryQuery.transaction_details =
          transaction.transcation_details;
        transactionHistoryQuery.transaction_date = transaction.transcation_date;
        transactionHistoryQuery.payment_type = transaction.type;
        transactionHistoryQuery.created_by = auth.user.id;
        transactionHistoryQuery.user_id = auth.user.id;
        transactionHistoryQuery.transaction_code = await getSerialCode(
          EU_SERIAL_CODE.TRANSACTION
        );

        await transactionHistoryQuery.save();
        query.payment_transaction_id = transactionHistoryQuery.id;
        query.document_price = transaction.transaction_amount;
      }

      if (transactionHistoryQuery.transaction_status == "COMPLETED") {
        //Add New purchase details
        query.created_by = 0;
        query.document_id = request.input("document_id");
        query.user_id = auth.user.id;
        query.purchase_date = request.input("purchase_date");
        query.document_price = request.input("document_price");

        await query.save();
        const visitor = await auth.authenticator("visitorAuth").getUser();
        ///Sending Email to user

        let invoice = await this.sendInvoice(
          query.id,
          transactionHistoryQuery,
          visitor,
          2, //2 Means purchase
          0 // to ignore basic subscription email
        );
        query.invoice = {
          id: invoice.id,
          invoice_no: invoice.invoice_no,
        };

        //Sending email to admin
        let attachment = await getInvoiceBuffer(
          { type: "EUINVOICE", id: invoice.id },
          visitor
        );

        setTimeout(() => {
          this.sendAdminPurchaseMail(
            visitor,
            transactionHistoryQuery,
            query,
            attachment
          );
        }, 2000);

        return response
          .status(200)
          .send({ message: "Created successfully", result: query });
      } else {
        return response
          .status(200)
          .send({ message: "PayPal Transaction failed" });
      }
    } catch (error) {
      console.log(error);
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async sendInvoice(id, transaction, user, type, basicplan) {
    let transaction_id = "";
    let transaction_amount = 0.0;
    if (transaction && transaction.id) {
      transaction_id = transaction.id;
      transaction_amount = transaction.transaction_amount;
    }
    const query = await Invoice.create({
      subscription_purchase_id: id,
      transaction_id: transaction_id,
      invoice_no: await getSerialCode(EU_SERIAL_CODE.INVOICE),
      invoice_date: new Date(),
      invoice_amount: transaction_amount,
      type: type,
      created_by: 0,
      created_at: new Date(),
    });

    let ispurchase = type == 2 ? 1 : 0;

    if (basicplan != 1)
      sendMail(
        { type: "EUINVOICE", id: query.id, ispurchase: ispurchase },
        user
      );

    return query;
  }

  async sendAdminMail(profiledata, ipaddress, country, city) {
    const subject = "New Visitor Signed up";
    const details = "New Visitor with below details have signup :";

    await Mail.send(
      "enduserSignupAdminMail",
      {
        title: subject,
        details: details,
        profile: profiledata,
        ipaddress: ipaddress,
        country: country,
        city: city,
      },
      (message) => {
        message.subject(subject);
        message.from(Env.get("MAIL_USERNAME"));
        message.to(Env.get("TO_MAIL_USERNAME"));
      }
    );
  }

  async sendAdminSubscriptionMail(
    visitor,
    transaction,
    subscription,
    attachment
  ) {
    const subject = "New Visitor Subscription";
    const details = "Below Visitor has subscribed for End User Portal :";
    const fileName = "Invoice Receipt";
    const plan_name = await MarketPlan.query()
      .where("id", subscription.plan_id)
      .pluck("plan_name");

    let txn = transaction.toJSON();
    let sub = subscription.toJSON();
    let transaction_amount = "0.0";

    let transaction_status = "Complete";

    if (txn) {
      transaction_amount = txn.transaction_amount;
      transaction_status = txn.transaction_status;
    }

    await Mail.send(
      "enduserSubscriptionAdminMail",
      {
        title: subject,
        details: details,
        planname: plan_name,
        subscription: sub,
        visitor: visitor,
        transaction_amount: transaction_amount,
        transaction_status: transaction_status,
      },
      (message) => {
        message.subject(subject);
        message.from(Env.get("MAIL_USERNAME"));
        message.attachData(new Buffer(attachment), `${fileName}.pdf`);
        message.to(Env.get("TO_MAIL_USERNAME"));
      }
    );
  }

  async sendAdminPurchaseMail(visitor, transaction, purchase, attachment) {
    const subject = "New Visitor Purchase";
    const details =
      "Below Visitor has purchase Document from End User Portal :";
    const fileName = "Purchase_Receipt";

    const document_name = await Document.query()
      .where("id", purchase.document_id)
      .pluck("name");
    let txn = transaction.toJSON();
    let purc = purchase.toJSON();
    let transaction_amount = "0.0";

    let transaction_status = "Complete";

    if (txn) {
      transaction_amount = txn.transaction_amount;
      transaction_status = txn.transaction_status;
    }

    try {
      await Mail.send(
        "enduserPurchaseAdminMail",
        {
          title: subject,
          details: details,
          document_name: document_name,
          purchase: purc,
          visitor: visitor,
          transaction_amount: transaction_amount,
          transaction_status: transaction_status,
        },
        (message) => {
          message.subject(subject);
          message.from(Env.get("MAIL_USERNAME"));
          message.attachData(new Buffer(attachment), `${fileName}.pdf`);
          message.to(Env.get("TO_MAIL_USERNAME"));
        }
      );
    } catch (error) {
      console.log("Error", error);
    }
  }

  async sendClientSubscriptionMail(user_id, subject, details) {
    if (!subject) {
      subject = "New Subscription";
    }
    if (!details) {
      details =
        "Thank you for subscribing. Your Subscription has been sent to Admin for Approval.";
    }

    const visitor = await Visitor.query()
      .select(["id", "name", "email"])
      .whereRaw(`id=(?)`, [user_id])
      .first();
    try {
      await Mail.send(
        "enduserSubscriptionClientMail",
        {
          title: subject,
          details: details,
          name: visitor.name,
        },
        (message) => {
          message.subject(subject);
          message.from(Env.get("MAIL_USERNAME"));
          message.to(visitor.email);
        }
      );
    } catch (error) {
      console.log("Error", error);
    }
  }

  async addTransaction({ request, response, auth }) {
    const transactionHistoryQuery = new transactionHistory();
    transactionHistoryQuery.payment_transaction_id = request.input(
      "payment_transaction_id"
    );
    transactionHistoryQuery.transaction_status = request.input("status");
    transactionHistoryQuery.transaction_amount =
      request.input("transaction_amount");
    transactionHistoryQuery.transaction_date = new Date();
    transactionHistoryQuery.user_id = auth.user.id;
    transactionHistoryQuery.transaction_code = await getSerialCode(
      EU_SERIAL_CODE.TRANSACTION
    );
    await transactionHistoryQuery.save();

    return response.status(200).send({ message: "Create successfully" });
  }

  async isUserLoggedIn({ request, auth, response }) {
    return response.status(200).send({ message: "User is loggedIn" });
  }
}

module.exports = VisitorController;
