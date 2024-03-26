"use strict";
const CronJob = use("App/Models/Admin/SettingModule/Cron/CronJob");
const CronJobLog = use("App/Models/Admin/SettingModule/Cron/CronJobLog");
const financial_service = require("../services/financials.service");
const basic_info = require("../Helper/basicInfoScraper");
const ip_patents = require("../services/patents.service");
const web_traffic = require("../services/webtraffic.service");
const google_trend = require("../services/googleTrend.service");
const twitter_data = require("../services/twitter.service");
const subscription_data = require("../services/subscription.service");
const vendorLogoService = require("../services/vendorlogo.service");

const fetch_rss = require("../services/rss.service");
const Logger = use("Logger");
const Task = use("Task");
const moment = require("moment");
class FetchCron extends Task {
  static get schedule() {
    return "* * */1 * *";
    // return "*/15 * * * * *";
  }

  async handle() {
    try {
      //let curdatetime = (moment().add(1,'days')).format("yyyy-MM-DD HH:mm:ss");
      let curdatetime = moment().format("yyyy-MM-DD HH:mm:ss");
      //Logger.transport("cronfile").info(`Cron Started`);
      const query = CronJob.query();
      // query.where(
      //   "next_execution_date",
      //   "<",
      //   moment().startOf("D").toISOString()
      // );
      // query.whereNot("status", "COMPLETED");
      // const data = (await query.fetch()).toJSON();

      // const query = CronJob.query();

      query.where(
        "next_execution_date",

        "<",

        curdatetime
      );

      query.whereNot("status", "COMPLETED");

      const data = (await query.fetch()).toJSON();
      Logger.transport("cronfile").info(`Cron job data ${data.length}`);
      if (data.length > 0) {
        let index = 0;
        //for (let index = 0; index < data.length; index++) {
        const element = data[index];

        const job = await CronJob.findOrFail(element.id);

        Logger.transport("cronfile").info(`Cron job started : ${job.type}`);
        let cronJoblog = {
          cron_job_id: job.id,
          execution_date: job.next_execution_date,
          type: job.type,
        };
        job.last_execution_date = moment(job.next_execution_date).format(
          "yyyy-MM-DD HH:mm:ss"
        );
        if (job.frequency == "ONCE") {
          job.status = "COMPLETED";
        }
        // if (!job.period.includes("d")) {
        job.next_execution_date = moment(job.next_execution_date)
          .add(...job.period.split(""))
          .format("yyyy-MM-DD HH:mm:ss");

        await job.save();
        try {
          let result = await executeService(job.type);
          if (result && result instanceof Array && result.length) {
            cronJoblog.status = "FAILED";
            cronJoblog.error_message = JSON.stringify(result);
          } else {
            cronJoblog.status = "COMPLETE";
          }
          const jobLog = await CronJobLog.create(cronJoblog);
          await jobLog.save();

          Logger.transport("cronfile").info(
            `Cron job completed ${job.type} with status ${cronJoblog.status}`
          );
        } catch (ex) {
          cronJoblog.status = "FAILED";
          const jobLog = await CronJobLog.create(cronJoblog);
          await jobLog.save();

          Logger.transport("cronfile").info(
            `Cron job completed ${job.type} with status ${cronJoblog.status} and error ${ex.message}`
          );
        }

        //}
      }
    } catch (ex) {
      console.log(ex.message);
      Logger.transport("cronfile").info(`Cron job Error ${ex.message}`);
    }
  }
}

async function executeService(type) {
  let error = null;
  switch (type) {
    case "FINANCIALS":
      error = await financial_service.fetchAllFinancials();
      break;
    case "COMPANY_DETAILS":
      error = await basic_info.fetchAllBasicInfo();
      // error = await basic_info.fetchLinkedInSalesInfo();
      break;
    case "IP_PATENT":
      error = await ip_patents.updateAllVendorPatents();
      break;
    case "WEB_TRAFFIC":
      error = await web_traffic.updateAllWebTraffic();
      break;
    case "GOOGLE_TRENDS":
      error = await google_trend.updateAllVendorTrend();
      break;
    case "TWITTER_DATA":
      error = await twitter_data.updateAllTwitterData();
      break;
    case "NEWS_LIST":
      error = await fetch_rss(null, {
        user: {
          id: null,
        },
      });
      break;
    case "MI_SUBSCRIPTION":
      error = await subscription_data.checkMISubscription();
      break;
    case "EU_SUBSCRIPTION":
      error = await subscription_data.checkEUSubscription();
      break;
    case "VENDOR_LOGO_UPDATE":
      error = await vendorLogoService.getVendorLogos();
      break;
    case "VENDOR_DETAILS":
      error = await basic_info.fetchVendorInfo();
      break;
    case "VISITOR_LINKEDIN_DETAILS":
      error = await basic_info.fetchAllVisitorLinkedInInfo();
      break;

    case "VENDOR_LINKEDIN_LOGO":
      error = await basic_info.getVendorLogosFromLinkedInUrl();
      break;
    case "FETCH_404_PRODUCTS":
      error = await basic_info.fetchWrongProductList();
      break;
    case "SERVICE_PROVIDER_LINKEDIN_LOGO":
      error = await basic_info.updateConsultantLogoFromLinkedInUrl();
      break;

    default:
      break;
  }
  return error;
}
module.exports = FetchCron;
