const axios = use("axios");
const Mail = use("Mail");
const Env = use("Env");
const logger = require("../Helper/logger");
const LoggerDebug = use("Logger");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const VisitorSubscription = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuSubcription"
);

const MIMarketPlan = use("App/Models/MarketPlan");
const MarketPlan = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuMarketPlan"
);
const MiSegment = use("App/Models/Admin/MISegmentModule/MISegment");
const Investor = use("App/Models/Investor");
const InvestorSubscription = use("App/Models/Subcription");
const qs = require("qs");

const Config = use("App/Models/Admin/ConfigModule/Config");
const moment = require("moment");
const _ = require("lodash");
const { URLS, KEYS } = require("../Helper/constants");
async function makePayPalCall(url, body = {}) {
  let tokenResponse = await getPaypalAuthToken();
  let headers = {
    Authorization: "Bearer " + tokenResponse.data.access_token,
  };
  return axios.post(`${URLS.PAYPAL_BASE_URL}/${url}`, body, { headers });
}
async function checkEUSubscription() {
  //Downgrade Expired Subscription
  const visitorSubquery = VisitorSubscription.query();
  visitorSubquery.where("is_active", true);
  visitorSubquery.where("subscription_end_date", "<", moment().format());

  const results = await visitorSubquery.fetch();
  const data = results.toJSON();
  LoggerDebug.transport("cronfile").info(
    `EU Subcription Expired ${data.length}`
  );

  if (data && data.length > 0) {
    let index = 0;

    for (index = 0; index < data.length; index++) {
      let isbasicplan = false;
      const query = await VisitorSubscription.findOrFail(data[index].id);
      query.is_active = false;
      if (query.plan_id == 1) {
        isbasicplan = true;
      }
      query.save();

      const futuresubquery = Subcription.query();

      futuresubquery.whereRaw(`user_id = (?) AND is_active = (?)`, [
        data[index].user_id,
        2,
      ]);

      const subfutureresult = await futuresubquery.first();

      if (subfutureresult && subfutureresult.id > 0) {
        LoggerDebug.transport("cronfile").info(
          `EU Subcription future subscription`
        );
        subfutureresult.is_active = 1;
        subfutureresult.save();
      } else {
        const subquery = await VisitorSubscription.create();
        //Downgrade to Basic Plan
        subquery.created_by = 0;
        subquery.updated_by = 0;
        subquery.is_active = true;
        subquery.plan_id = 1;
        subquery.user_id = data[index].user_id;
        let start_date = moment().format("yyyy-MM-DD") + " 00:00:00.000";
        subquery.subscription_start_date = start_date;
        //console.log(start_date);
        let end_date =
          moment().add(365, "days").format("yyyy-MM-DD") + " 00:00:00.000";
        //console.log(end_date)
        subquery.subscription_end_date = end_date;
        await subquery.save();
        LoggerDebug.transport("cronfile").info(
          `EU Subcription Basic subscription`
        );
        //Send Email Subscription Downgrade
        if (!isbasicplan)
          this.sendEmailEuSubscriptionDowngrade(subquery, data[index].name);
      }
    }
  }

  //Send Emails Upcoming Expiring Subscription
  this.sendEmailEuSubscription();
}

async function sendEmailEuSubscriptionDowngrade(name) {
  try {
    await Mail.send(
      "subscriptionNotification",
      {
        title: "Subscription Downgrade Notification",
        details:
          "Your Current ITMAP Subscription has expired and downgraded to Basic Plan, please visit the ITMAP Portal to upgrade",
        name: name,
      },
      (message) => {
        message.subject("ITMAP Subscription Downgraded");
        message.from(Env.get("MAIL_USERNAME"));
        message.to(data[index].users.email);
      }
    );
  } catch (ex) {
    LoggerDebug.transport("cronfile").info(
      `EU Subscription Email error ${JSON.stringify(ex.message)}`
    );
  }
}

async function sendEmailEuSubscription() {
  let [daystring] = await Config.query()
    .where("key", "SubscriptionExpiryNotificationDays")
    .pluck("value");

  var days = daystring;

  const visitorSubquery = VisitorSubscription.query();
  visitorSubquery.where("is_active", true);
  let thrshold_date =
    moment().add(days, "days").format("yyyy-MM-DD") + " 00:00:00.000";

  visitorSubquery.where("subscription_end_date", "<=", thrshold_date);
  visitorSubquery.with("users", (builder) => {
    builder.select("id", "name", "email"); //  select columns / pass array of columns
  });

  const results = await visitorSubquery.fetch();

  let data = results.toJSON();

  LoggerDebug.transport("cronfile").info(
    `EU subscription Expiring Email  ${data.length}`
  );
  if (data) {
    let index = 0;

    for (index = 0; index < data.length; index++) {
      let visitorname = data[index].users.name;
      let planname = await MarketPlan.query()
        .where("id", data[index].plan_id)
        .pluck("plan_name");
      var end_date = moment(data[index].subscription_end_date, "DD-MM-yyyy");
      var cur_date = moment().format("DD-MM-yyyy");

      let daydifference = end_date.diff(cur_date, "days");

      var details =
        "Your ITMAP " +
        planname +
        " Subscription is going to expire in " +
        daydifference +
        " days on " +
        data[index].subscription_end_date +
        ", please renew soon on ITMAP Portal";

      if (daydifference <= 0) {
        details =
          "Your ITMAP " +
          planname +
          " Subscription has expired on " +
          data[index].subscription_end_date +
          ", please renew soon on ITMAP Portal";
      }

      if (
        daydifference <= 0 ||
        daydifference == 7 ||
        daydifference == 15 ||
        daydifference == 30
      ) {
        try {
          await Mail.send(
            "subscriptionNotification",
            {
              title: "ITMAP Subscription",
              details: details,

              name: visitorname,
            },
            (message) => {
              message.subject("ITMAP Subscription Expiring");
              message.from(Env.get("MAIL_USERNAME"));
              message.to(data[index].users.email);
            }
          );
        } catch (ex) {
          LoggerDebug.transport("cronfile").info(
            `EU subscription Expiring Email error ${JSON.stringify(ex.message)}`
          );
        }
      }
    }
  }
}

async function checkMISubscription() {
  //Downgrade Expired Subscription
  const investorSubquery = InvestorSubscription.query();
  investorSubquery.where("is_active", true);
  investorSubquery.where("subscription_end_date", "<", moment().format());
  investorSubquery.with("plans", (builder) => {
    builder.select("id", "plan_name", "segment_id");
  });
  const results = await investorSubquery.fetch();
  let data = results.toJSON();
  let index = 0;

  LoggerDebug.transport("cronfile").info(
    `Mi Subscription Expired ${data.length}`
  );

  for (index = 0; index < data.length; index++) {
    const query = await InvestorSubscription.findOrFail(data[index].id);
    query.is_active = false;

    query.save();

    const misegment = await MiSegment.query()
      .where("id", data[index].plans.segment_id)
      .pluck("name");
    const investorname = await Investor.query()
      .where("id", data[index].user_id)
      .pluck("name");
    sendEmailMiSubscriptionExpired(
      data[index].subcription_code,
      investorname,
      misegment
    );
  }

  //Send Emails Upcoming Expiring Subscription
  this.sendEmailMISubscription();
}

async function sendEmailMISubscription() {
  let [daystring] = await Config.query()
    .where("key", "SubscriptionExpiryNotificationDays")
    .pluck("value");

  var days = daystring;

  const investorSubquery = InvestorSubscription.query();
  investorSubquery.where("is_active", true);
  let thrshold_date =
    moment().add(days, "days").format("yyyy-MM-DD") + " 00:00:00.000";
  investorSubquery.where("subscription_end_date", "<=", thrshold_date);
  investorSubquery.with("users", (builder) => {
    builder.select("id", "name", "email"); //  select columns / pass array of columns
  });

  const results = await investorSubquery.fetch();
  let data = results.toJSON();

  LoggerDebug.transport("cronfile").info(
    `MI Subcription Expiring Count  ${data.length}`
  );

  if (data) {
    let index = 0;

    for (index = 0; index < data.length; index++) {
      let investorname = data[index].users.name;
      let planname = await MIMarketPlan.query()
        .where("id", data[index].plan_id)
        .pluck("plan_name");

      var end_date = moment(data[index].subscription_end_date, "DD-MM-yyyy");
      var cur_date = moment("04-01-2022", "DD-MM-yyyy");

      let daydifference = end_date.diff(cur_date, "days");

      var details =
        "Your ITMAP " +
        planname +
        " Subscription (" +
        data[index].subcription_code +
        ") is going to expire in " +
        daydifference +
        " days on " +
        data[index].subscription_end_date +
        ", please renew soon on ITMAP Portal";

      if (daydifference <= 0) {
        details =
          "Your ITMAP " +
          planname +
          " Subscription (" +
          data[index].subcription_code +
          ") has expired on " +
          data[index].subscription_end_date +
          ", please renew soon on ITMAP Portal";
      }

      try {
        await Mail.send(
          "subscriptionNotification",
          {
            title:
              "Your ITMAP Market Intelligence Subscription is going to expire",
            details: details,
            name: investorname,
          },
          (message) => {
            message.subject("ITMAP Market Intelligence Subscription Expiring");
            message.from(Env.get("MAIL_USERNAME"));
            message.to(data[index].users.email);
          }
        );
      } catch (ex) {
        LoggerDebug.transport("cronfile").info(
          `MI Subcription Expiring Email Error ${JSON.stringify(ex.message)}`
        );
      }
    }
  }
}

async function sendEmailMiSubscriptionExpired(subscriptioncode, name, segment) {
  try {
    await Mail.send(
      "subscriptionNotification",
      {
        title: "Subscription Expiration Notification",
        details:
          "Your Current Market Intelligence Subscription ( " +
          segment +
          " - Subscription Code: " +
          subscriptioncode +
          "  ) has expired, please visit the Market Intelligence Portal to upgrade",
        name: name,
      },
      (message) => {
        message.subject("ITMAP Subscription Expired");
        message.from(Env.get("MAIL_USERNAME"));
        message.to(data[index].users.email);
      }
    );
  } catch (ex) {
    LoggerDebug.transport("cronfile").info(
      `MI Subcription Expired Email Error ${JSON.stringify(ex.message)}`
    );
  }
}

async function cancelSubscription({ id, reason }, user) {
  let query = InvestorSubscription.query();
  let response = {
    error: null,
    data: null,
  };

  query.select("subcriptions.paypal_subscription_id");
  query.select("subcriptions.id");
  query.leftJoin(
    "transaction_histories",
    "transaction_histories.id",
    "subcriptions.transaction_id"
  );
  query.where("transaction_histories.payment_transaction_id", id);
  query.where("subcriptions.is_auto_renewal", true);
  let [data] = (await query.fetch()).toJSON();
  let update_status = false;
  if (data.paypal_subscription_id) {
    try {
      await makePayPalCall(
        `v1/billing/subscriptions/${data.paypal_subscription_id}/cancel`,
        {
          reason,
        }
      );
      response.data = {
        message: "SUCESS",
      };
      update_status = true;
    } catch (ex) {
      if (ex.response && ex.response.data && ex.response.data.details.length) {
        update_status = true;
        response.error = ex.response.data.details[0];
      }
    }
    if (update_status) {
      await InvestorSubscription.query().where({ id: data.id }).update({
        is_auto_renewal: false,
      });
    }
  }
  return response;
}
async function showPayment({ id }, user) {
  // let query = InvestorSubscription.query();
  let response = {
    error: null,
    data: null,
  };

  // query.select("subcriptions.paypal_subscription_id");
  // query.select("subcriptions.id");
  // query.leftJoin(
  //   "transaction_histories",
  //   "transaction_histories.id",
  //   "subcriptions.transaction_id"
  // );
  // query.where("transaction_histories.payment_transaction_id", id);
  // query.where("subcriptions.is_auto_renewal", true);
  // let [data] = (await query.fetch()).toJSON();
  // let update_status = false;
  try {
    let tokenResponse = await getPaypalAuthToken();
    let url = `v2/payments/captures/${id}`;
    let headers = {
      Authorization: "Bearer " + tokenResponse.data.access_token,
    };
    return axios.get(`${URLS.PAYPAL_BASE_URL}/${url}`, { headers });
  } catch (ex) {
    console.log("ERR", ex);
    // if (ex.response && ex.response.data && ex.response.data.details.length) {
    //   update_status = true;
    //   response.error = ex.response.data.details[0];
    // }
  }

  // return response;
}

async function getPaypalAuthToken() {
  try {
    let userName = await Config.findOrCreate(
      { key: KEYS.PAYPAL_GET_AUTH_TOKEN_USERNAME },
      { key: KEYS.PAYPAL_GET_AUTH_TOKEN_USERNAME, value: "test" }
    );
    let password = await Config.findOrCreate(
      { key: KEYS.PAYPAL_GET_AUTH_TOKEN_PASSWORD },
      { key: KEYS.PAYPAL_GET_AUTH_TOKEN_PASSWORD, value: "test" }
    );

    const token = `${userName.value}:${password.value}`;
    const encodedToken = Buffer.from(token).toString("base64");
    const headers = {
      Authorization: "Basic " + encodedToken,
      "content-type": "application/x-www-form-urlencoded",
    };

    return await axios.post(
      `${URLS.PAYPAL_GET_TOKEN_URL}`,
      qs.stringify({ grant_type: "client_credentials" }),
      { headers }
    );
  } catch (error) {
    console.log(error);
  }
}
module.exports = {
  checkEUSubscription,
  checkMISubscription,
  cancelSubscription,
  getPaypalAuthToken,
  sendEmailEuSubscription,
  sendEmailEuSubscriptionDowngrade,
  sendEmailMISubscription,
  sendEmailMiSubscriptionExpired,
  showPayment,
};
