"use strict";

const VendorTwitterDatas = use(
  "App/Models/Admin/VendorModule/VendorTwitterDatas"
);
const twitterService = require("../../services/twitter.service");
const Query = use("Query");
const moment = require("moment");
const { formatMonthlyResponse } = require("../../Helper/stats");

const searchInFields = [
  "tweet_count",
  "retweet_count",
  "month",
  "year",
  "number_followers",
  "mentions",
  "sentiment",
];

class VendorTwitterDatumController {
  async index({ request, response }) {
    const query = VendorTwitterDatas.query();
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

    if (request.input("vendor_id")) {
      query.where("vendor_id", request.input("vendor_id"));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
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
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
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
    const query = new VendorTwitterDatas();

    query.vendor_id = request.input("vendor_id");
    query.tweet_count = request.input("tweet_count");
    query.retweet_count = request.input("retweet_count");
    query.month = request.input("month");
    query.year = request.input("year");
    query.number_followers = request.input("number_followers");
    query.mentions = request.input("mentions");
    query.sentiment = request.input("sentiment");

    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, response }) {
    const query = VendorTwitterDatas.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await VendorTwitterDatas.findOrFail(params.id);
    query.vendor_id = request.input("vendor_id");
    query.tweet_count = request.input("tweet_count");
    query.retweet_count = request.input("retweet_count");
    query.month = request.input("month");
    query.year = request.input("year");
    query.number_followers = request.input("number_followers");
    query.mentions = request.input("mentions");
    query.sentiment = request.input("sentiment");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await VendorTwitterDatas.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async stats({ params, response }) {
    const query = VendorTwitterDatas.query();
    query.where("vendor_twitter_datas.vendor_id", params.id);
    query.where("vendor_twitter_datas.year", ">=", moment().subtract(3,'years').format('yyyy'));
    query.select("vendor_twitter_datas.*");
    query.select("vendor_twitter_mentions.mention_count as mention_count");
    query.orderBy("month_id");
    query.leftJoin("vendor_twitter_mentions", function () {
      this.on(
        "vendor_twitter_mentions.vendor_id",
        "vendor_twitter_datas.vendor_id"
      )
        .on("vendor_twitter_mentions.year", "vendor_twitter_datas.year")
        .on("vendor_twitter_mentions.month", "vendor_twitter_datas.month");
    });
    const result = await query.fetch();
    return response.status(200).send(
      formatMonthlyResponse(result.toJSON(), [
        { field: "tweet_count", action: "sum" },
        { field: "retweet_count", action: "sum" },
        { field: "mention_count", action: "sum" },
        { field: "quote_count", action: "sum" },
        { field: "like_count", action: "sum" },
        { field: "reply_count", action: "sum" },
        { field: "number_followers", action: "mean" },
      ])
    );
  }
}

module.exports = VendorTwitterDatumController;
