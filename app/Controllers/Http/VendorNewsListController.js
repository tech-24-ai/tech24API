"use strict";

const VendorNewsList = use("App/Models/VendorNewsList");

const Query = use("Query");
const moment = require("moment");

const searchInFields = [
  "news_title",
  "news_link",
  "news_thumbnail",
  "is_news_active",
  "news_date",
  "news_source",
];

class VendorNewsListController {
  async index({ request, response }) {
    const query = VendorNewsList.query();
    query.select("vendor_news_lists.*");
    query.select("rsses.name as rss_name");
    query.orderBy("news_date", "desc");
    query.leftJoin("rsses", "rsses.id", "vendor_news_lists.news_source");
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
    const query = new VendorNewsList();

    query.vendor_id = request.input("vendor_id");
    query.news_title = request.input("news_title");
    query.news_link = request.input("news_link");
    query.news_thumbnail = request.input("news_thumbnail");
    query.is_news_active = request.input("is_news_active");
    query.news_date = request.input("news_date");
    query.news_source = request.input("news_source");

    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, response }) {
    const query = VendorNewsList.query();
    query.where("id", params.id);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await VendorNewsList.findOrFail(params.id);
    query.vendor_id = request.input("vendor_id");
    query.news_title = request.input("news_title");
    query.news_link = request.input("news_link");
    query.news_thumbnail = request.input("news_thumbnail");
    query.is_news_active = request.input("is_news_active");
    query.news_date = request.input("news_date");
    query.news_source = request.input("news_source");
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await VendorNewsList.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }
}

module.exports = VendorNewsListController;
