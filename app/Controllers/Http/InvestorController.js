"use strict";

const Investor = use("App/Models/Investor");
const MISegment = use("App/Models/Admin/MISegmentModule/MISegment");
const Module = use('App/Models/Admin/ProductModule/Module')
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const Document = use("App/Models/Admin/DocumentModule/Document");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const Query = use("Query");
const Excel = require("exceljs");
const moment = require("moment");
const Mail = use("Mail");
const Env = use("Env");
const _ = require("lodash");
const geoip = require("geoip-lite");
const TransactionHistory = use("App/Models/TransactionHistory");
const Subcription = use("App/Models/Subcription");

const searchInFields = [
  "id",
  "name",
  "email",
  "mobile",
  "designation",
  "company",
  "status",
];
const requestOnly = [
  "name",
  "email",
  "mobile",
  "designation",
  "company",
  "is_company",
  "status",
  "password",
];
const { getAllSubscription } = require("../../Helper/userSubscription");
class InvestorController {
  async index({ request, response, view }) {
    const query = Investor.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    let investor_type = '';
    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "investor_type":
            if(filter.value == 'Investor'){
              query.where("is_company", false)
            } else {
              query.where("is_company", true)
            }
          break;
          case "created_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          default:
            let queryStr = "";
            if (Array.isArray(filter.value)) {
              filter.value.forEach((x) => {
                if (queryStr != "") queryStr += " or ";
                queryStr += `${filter.name} LIKE '%${x}%'`;
              });
            } else {
              queryStr = `${filter.name} LIKE '%${filter.value}%'`;
            }
            query.whereRaw(queryStr);
            break;
        }
      });
    }

    

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    }

    let page = null;
    let pageSize = null;

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("pageSize")) {
      pageSize = request.input("pageSize");
    }

    var result;
    if (page && pageSize) {
      result = await query.paginate(page, pageSize);
    } else {
      result = await query.fetch();
    }

    return response.status(200).send(result);
  }

  async store({ request, response }) {
    var body = request.only(requestOnly);
    const query = await Investor.create(body);
    await query.mi_segments().detach();
    await query.mi_segments().attach(JSON.parse(request.input("mi_segments")));
    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, request, response, view }) {
    const query = Investor.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    const mi_segmentsIds = await result.mi_segments().ids();
    result.mi_segments = mi_segmentsIds;
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const query = await Investor.findOrFail(params.id);
    query.merge(body);
    await query.save();
    await query.mi_segments().detach();
    await query.mi_segments().attach(JSON.parse(request.input("mi_segments")));
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, request, response }) {
    const query = await Investor.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async changePassword({ params, request, response }) {
    let query = await Investor.findOrFail(params.id);
    query.password = request.input("password");
    await query.save();
    return response
      .status(200)
      .send({ message: "Password update successfully" });
  }

  async register({ request, auth, response }) {
    const result = await Investor.query()
      .where("email", request.input("email"))
      .fetch();

    const data = result.toJSON();

    if (data && data.length > 0) {
      let accessToken = await auth
        .authenticator("investorAuth")
        .generate(result);

      if (data.status == 2) {
        let hours = moment
          .duration(moment(data.created_at).diff(moment()))
          .asHours();

        if (hours > 24) {
          this.sendActivateMail(data.id, data.email, accessToken);
          return response.status(200).send({
            message:
              "Thanks for your request, you will receive email to activate your account.",
            data: { data: result },
          });
        } else {
          return response.status(200).send({
            message:
              "You are already registered, please activate your account by clicking the link received in the email.",
            data: { data: result },
          });
        }
      } else {
        return response.status(200).send({
          message: "Your account is already registered, please login.",
          data: { data: result },
        });
      }
    } else {
      const ipAddress = _.split(request.header("X-Forwarded-For"), ",");
      let guest_ip = _.trim(_.first(ipAddress));
      guest_ip =
        guest_ip && guest_ip != ""
          ? guest_ip
          : request.request.socket.remoteAddress;

      let geo = geoip.lookup(guest_ip);
      let visitor_ip_country = geo ? geo.country : "";
      let visitor_ip_city = geo ? geo.city : "";

      var body = request.only(requestOnly);
      const result = await Investor.create({
        ...body,
        is_company: body.is_company == "true",
        status: 2, //Pending to Activate
      });

      let accessToken = await auth
        .authenticator("investorAuth")
        .generate(result);

      this.sendActivateMail(result.id, result.email, accessToken.token);

      this.sendAdminMail(result, guest_ip, visitor_ip_country, visitor_ip_city);
      return response.status(200).send({
        message:
          "Thanks for your request, you will receive email to activate your account.",
        data: { data: result },
      });
    }
  }

  async activateAccount({ request, auth, response }) {
    const user = await auth.authenticator("investorAuth").getUser();

    if (user) {
      const result = await Investor.findOrFail(user.id);

      let hours = moment.duration(moment().diff(moment(user.created_at))).asHours();
      if (user.status == 1) { //Active
        return response.status(200).send({
          message: "Your Account is already activated",
        });
      } else {
        if (hours > 24) {
          return response.status(200).send({
            message:
              "Your Account activation link has expired, please register again",
          });
        } else {
          result.status = 1; //Active
          result.save();
          return response.status(200).send({
            message:
              "Your Account is activated, please login into your account",
          });
        }
      }
    } else {
      return response.status(200).send({
        message: "Your Account is not available in the system, please register",
      });
    }
  }

  async login({ request, auth, response }) {
    const email = request.input("email");
    const password = request.input("password");
    if (await auth.authenticator("investorAuth").attempt(email, password)) {
      let query = Investor.query();
      query.where("email", email);
      query.with("mi_segments");
      let result = await query.fetch();
      let [user] = result.toJSON();
      if (user.status != 1) {
        let msg = "Your profile is inactive. Contact your administrator.";
        if (user.status == 2)
          msg =
            "Your profile is not activated. Please activate by clicking activation link recevied in the registered email.";
        throw new Error(msg);
      }

      let accessToken = await auth.authenticator("investorAuth").generate(user);
      return response.status(200).send({
        message: "Login successful",
        data: { data: user, access_token: accessToken },
      });
    } else {
      return response
        .status(404)
        .send({ message: "Please register to login!" });
    }
  }

  async sendForgotPasswordMail(id, mail, access_token) {
    const user = await Investor.query().where("id", id).first();
    const subject = "Market Intelligence - Forgot Password";
    const details = "please use below link to reset your password.";
    const link =
    Env.get("MI_FORGOTPASSWORD") + "/webPages/forgot_resetpassword?token=" +
      access_token.token;
    await Mail.send(
      "forgotPassword",
      { title: subject, details: details, name: user.name, link: link },
      (message) => {
        message.subject(subject);
        message.from(Env.get("MAIL_USERNAME"));
        message.to(mail);
      }
    );
  }

  async sendActivateMail(id, mail, access_token) {
    const user = await Investor.query().where("id", id).first();
    const subject = "Market Intelligence - Activate Email";
    const details =
      "Welcome to Market Intelligence, please use below link to activate your account";
    const link =
    Env.get("MI_FORGOTPASSWORD") + "/webPages/activate_email?token=" +
      access_token;
    await Mail.send(
      "miEmailActivate",
      { title: subject, details: details, name: user.name, link: link },
      (message) => {
        message.subject(subject);
        message.from(Env.get("MAIL_USERNAME"));
        message.to(mail);
      }
    );
  }

  async sendAdminMail(profiledata, ipaddress, country, city) {
    const subject = "New Sign up in Market Intelligence";
    const details = "New User with below details have signup :";
    let type;

    if (profiledata.is_company) {
      type = "Company";
    } else {
      type = "Investor";
    }

    await Mail.send(
      "miSignupAdminMail",
      {
        title: subject,
        details: details,
        type: type,
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

  async forgotpassword({ request, auth, response }) {
    const email = request.input("email");

    let query = Investor.query();
    query.where("email", email);
    let result = await query.fetch();
    let [user] = result.toJSON();
    if (user) {
      if (user.status != 1) {
        let msg = "Your profile is inactive. Contact your administrator.";
        if (user.status == 2)
          msg =
            "Your profile is not activated. Please activate your email account.";
        throw new Error(msg);
      } else {
        //Send Password
        let accessToken = await auth
          .authenticator("investorAuth")
          .generate(user);
        await this.sendForgotPasswordMail(user.id, email, accessToken);

        return response.status(200).send({
          message: "We have sent link to reset your password over email",
        });
      }
    } else {
      let msg = "Invalid Email ID.";

      throw new Error(msg);
    }
  }

  async forgot_resetpassword({ request, auth, response }) {
    const password = request.input("password");

    const user = await auth.authenticator("investorAuth").getUser();

    user.password = password;
    await user.save();

    return response.status(200).send({
      message: "Your new password is updated",
    });
  }

  async resetpassword({ request, auth, response }) {
    const oldpassword = request.input("oldpassword");
    const password = request.input("password");

    const user = await auth.authenticator("investorAuth").getUser();

    if (
      await auth.authenticator("investorAuth").attempt(user.email, oldpassword)
    ) {
      user.password = password;
      await user.save();

      return response.status(200).send({
        message: "Your new password is updated",
      });
    } else {
      return response.status(500).send({
        message: "Your current password is wrong",
      });
    }
  }

  async getProfile({ auth, response }) {
    const user = await auth.authenticator("investorAuth").getUser();
    return response.status(200).send(user);
  }
  async updateProfile({ auth, request, response }) {
    const user = await auth.authenticator("investorAuth").getUser();
    var body = request.only(requestOnly);
    user.merge(body);
    await user.save();
    return response.status(200).send(user);
  }

  async dashboard({ auth, response }) {
    let user = { id: 0 };
    let segments = [];
    try {
      user = await auth.authenticator("investorAuth").getUser();
    } catch (ex) {}
    let query = Investor.query();
    query.where("id", user.id);
    let result = await query.fetch();

    const marketcount = await Module.query().where('parent_id', null).with('children', (children1) => {
      if (!request.input('edit')) {
        children1.whereNotIn('id', moduleIds)
      }
      children1.with('children', (children2) => {
        if (!request.input('edit')) {
          children2.whereNotIn('id', moduleIds)
        }
        children2.with('children', (children3) => {
          if (!request.input('edit')) {
            children3.whereNotIn('id', moduleIds)
          }
          children3.with('children', (children4) => {
            if (!request.input('edit')) {
              children4.whereNotIn('id', moduleIds)
            }
            children4.with('children', (children5) => {
              if (!request.input('edit')) {
                children5.whereNotIn('id', moduleIds)
              }
              children5.with('children', (children6) => {
                if (!request.input('edit')) {
                  children6.whereNotIn('id', moduleIds)
                }
              })
            })
          })
        })
      })
    }).getCount();
    const vendorcount = await Vendor.query().where("is_deleted", 0).getCount();
    const visitorcount = await Visitor.query().whereNot("linkedin_link", null).where("is_blocked",0).getCount();
    const documentcount = await Document.query().where("document_type_id",1).getCount();


    let [data] = result.toJSON();
    if (!data) {
      data = {
        name: "Guest",
      };
    } else {
      const user_subscription = Subcription.query();
      user_subscription.where("subscription_end_date", ">", new Date());
      user_subscription.where("subcriptions.user_id", user.id);
      user_subscription.with("plans");
      let rs = (await user_subscription.fetch()).toJSON();
      rs.forEach((x) => {
        segments.push(x.plans.segment_id);
      });
    }
    
    data.mi_segments = (
      await MISegment.query()
        .whereIn("id", segments)
        .orWhere("is_free", true)
        .orderBy("order_no")
        .fetch()
    ).toJSON();

    const topSection = [
      {
        name: "Markets",
        value: marketcount,
      },
      {
        name: "Companies",
        value: vendorcount,
      },
      {
        name: "In-Depth Reports",
        value: documentcount,
      },
      {
        name: "Data Points",
        value: visitorcount,
      },
    ];
    const miSegments = (
      await MISegment.query().orderBy("order_no").fetch()
    ).toJSON();
    const midSection = miSegments;
    return response.status(200).send({
      user: data,
      topSection: topSection,
      midSection: midSection,
    });
  }




  async subscription_details({ auth, response }) {
    let user = await auth.authenticator("investorAuth").getUser();
    let data = await getAllSubscription(user.id);
    return response.status(200).send({ data });
  }

  async transaction_details({ auth, response }) {
    let user = await auth.authenticator("investorAuth").getUser();
    let query = Subcription.query();
    query.where("subcriptions.user_id", user.id);
    query.leftJoin(
      "transaction_histories",
      "transaction_histories.id",
      "subcriptions.transaction_id"
    );
    query.leftJoin(
      "invoices",
      "invoices.transaction_id",
      "transaction_histories.id"
    );
    query.select("subcriptions.subscription_end_date");
    query.select("subcriptions.is_active");
    query.select("subcriptions.is_auto_renewal");
    query.select("subcriptions.subscription_start_date");
    query.select("transaction_histories.payment_transaction_id");
    query.select("invoices.id as invoice_id");
    query.orderBy("subcriptions.subscription_end_date", "desc");
    let result = (await query.fetch()).toJSON();
    return response.status(200).send(result);
  }

  
  async store_transaction({ request, response, auth }) {
    const visitor = await auth.authenticator("visitorAuth").getUser();
    const transactionHistoryQuery = new TransactionHistory();
    transactionHistoryQuery.payment_transaction_id = request.input(
      "payment_transaction_id"
    );
    transactionHistoryQuery.transaction_status = request.input("status");
    transactionHistoryQuery.transaction_amount = request.input(
      "transaction_amount"
    );
    transactionHistoryQuery.transaction_date = new Date();
    transactionHistoryQuery.user_id = visitor.id;
    transactionHistoryQuery.transaction_code = await getSerialCode(
      SERIAL_CODE.TRANSACTION
    );
    await transactionHistoryQuery.save();

    return response.status(200).send({ message: "Create successfully" });
  }

  async exportReport({ request, response, view }) {
    const query = Investor.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {

          case "investor_type":
            if(filter.value == 'Investor'){
              query.where("is_company", false)
            } else {
              query.where("is_company", true)
            }
          break;
          case "created_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              typeof filter.value == "object"
                ? `DATE(${filter.name}) between '${filter.value.startDate}' and '${filter.value.endDate}'`
                : `DATE(${filter.name}) = '${moment(filter.value).format(
                    "YYYY-MM-DD"
                  )}'`
            );
            break;
          default:
            let queryStr = "";
            if (Array.isArray(filter.value)) {
              filter.value.forEach((x) => {
                if (queryStr != "") queryStr += " or ";
                queryStr += `${filter.name} LIKE '%${x}%'`;
              });
            } else {
              queryStr = `${filter.name} LIKE '%${filter.value}%'`;
            }
            query.whereRaw(queryStr);
            break;
        }
      });
    }

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    }

    var result = await query.fetch();

    const fileName = "investors-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Investor List");
    let font = { name: "Arial", size: 12 };

    const data = await result.toJSON();
    let exportData = [];
    let index = 1;

    if (data) {
      data.forEach((element) => {
        let is_company = "Investor";

        if (element.is_company == 1) {
          is_company = "Company User";
        }

        let status = "Pending";

        if (element.status == 0) {
          status = "Inactive";
        } else if (element.status == 1) {
          status = "Active";
        }

        exportData.push({
          sno: index++,
          name: element.name,
          email: element.email,
          mobile: element.mobile,
          designation: element.designation,
          company: element.company,
          is_company: is_company,
          status: element.status,
          created: element.created_at,
          updated: element.updated_at,
        });
      });
    }

    let columns = [
      { header: "S. No.", key: "sno", width: 10, style: { font: font } },
      { header: "Name", key: "name", width: 30, style: { font: font } },
      { header: "Email", key: "email", width: 30, style: { font: font } },
      { header: "Mobile", key: "mobile", width: 30, style: { font: font } },
      {
        header: "Designation",
        key: "designation",
        width: 30,
        style: { font: font },
      },
      {
        header: "Investor/Company User",
        key: "is_company",
        width: 30,
        style: { font: font },
      },
      { header: "Company", key: "company", width: 30, style: { font: font } },

      { header: "Status", key: "status", width: 30, style: { font: font } },
      {
        header: "Created",
        key: "created_at",
        width: 30,
        style: { font: font },
      },
      {
        header: "Updated",
        key: "updated_at",
        width: 30,
        style: { font: font },
      },
    ];

    worksheet.columns = columns;
    worksheet.addRows(exportData);

    worksheet.getCell("B1", "C1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "cccccc" },
    };

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }
}

module.exports = InvestorController;
