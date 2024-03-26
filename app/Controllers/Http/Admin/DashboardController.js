"use strict";
const Category = use("App/Models/Admin/ProductModule/Category");
const Module = use("App/Models/Admin/ProductModule/Module");
const Product = use("App/Models/Product");
const Visitor = use("App/Models/Admin/VisitorModule/Visitor");
const Subscription = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuSubcription"
);
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const SearchReportProduct = use("App/Models/Report/SearchReportProduct");

const moment = require("moment");
const Consultant = use("App/Models/Admin/ConsultantModule/Consultant");
const BookingHistory = use("App/Models/Admin/ConsultantModule/BookingHistory");
const { getProfile } = require("../../../Helper/consultant");
class DashboardController {
  async index({ response }) {
    let data = [];
    // data.push({
    //     name: 'Total Categories',
    //     icon: 'description',
    //     color: 'warning',
    //     value: await Category.query().getCount()
    // })
    // data.push({
    //     name: 'Total Modules',
    //     icon: 'description',
    //     color: 'success',
    //     value: await Module.query().where('parent_id', null).getCount()
    // })
    // data.push({
    //     name: 'Total Sub Modules',
    //     icon: 'description',
    //     color: 'danger',
    //     value: await Module.query().whereNot('parent_id', null).getCount()
    // })
    data.push({
      name: "Total Products",
      icon: "description",
      color: "primary",
      value: await Product.count({}),
    });
    data.push({
      name: "Total Visitors",
      icon: "people",
      color: "success",
      value: await Visitor.query().getCount(),
    });
    data.push({
      name: "Total Vendors",
      icon: "contact_mail",
      color: "warning",
      value: await Vendor.query().getCount(),
    });
    data.push({
      name: "Total Product Searched",
      icon: "redeem",
      color: "danger",
      value: await SearchReportProduct.query().getCount(),
    });
    data.push({
      name: "Total Subscribed Visitors",
      icon: "attach_money",
      color: "success",
      value: await Subscription.query()
        .where("is_active", 1)
        .groupBy("user_id")
        .getCount(),
    });
    return response.status(200).send({ data });
  }

  async consultant({ response, auth }) {
    const user = await getProfile(auth);
    console.log("user", user);
    let data = [];
    const bookingQuery1 = BookingHistory.query();
    if (user.consultant_id != undefined) {
      bookingQuery1.where("consultant_id", user.consultant_id);
    }
    data.push({
      name: "Total Booking",
      icon: "description",
      color: "primary",
      value: await bookingQuery1.getCount(),
    });

    const bookingQuery2 = BookingHistory.query();
    bookingQuery2.whereRaw("booking_date >= ?", [
      moment().format("YYYY-MM-DD"),
    ]);
    if (user.consultant_id != undefined) {
      bookingQuery2.where("consultant_id", user.consultant_id);
    }
    data.push({
      name: "Upcoming Booking",
      icon: "description",
      color: "info",
      value: await bookingQuery2.getCount(),
    });
    if (user.consultant_id == undefined) {
      data.push({
        name: "Total Active Consultant",
        icon: "people",
        color: "success",
        value: await Consultant.query().where("status", "Active").getCount(),
      });
      data.push({
        name: "Total Pending Consultant",
        icon: "people",
        color: "warning",
        value: await Consultant.query().where("status", "Pending").getCount(),
      });
    } else {
      data.push({
        name: "Pending Payouts",
        icon: "redeem",
        color: "danger",
        value: await Consultant.query()
          .where("id", user.consultant_id)
          .getSum("total_payment"),
      });
      data.push({
        name: "Total Visitors",
        icon: "people",
        color: "warning",
        value: await BookingHistory.query()
          .where("id", user.consultant_id)
          .groupBy("visitor_id")
          .getCount(),
      });
    }

    return response.status(200).send({ data });
  }
}

module.exports = DashboardController;
