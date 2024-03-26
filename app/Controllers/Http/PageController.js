"use strict";
const Page = use("App/Models/Page");
const Query = use("Query");
const moment = require("moment");
const searchInFields = ["id", "name", "slug"];
class PageController {
  async index({ request, response, view }) {
    const query = Page.query();

    let page = 1;
    let pageSize = 5;

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("pageSize")) {
      pageSize = request.input("pageSize");
    }

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

    const result = await query.paginate(page, pageSize);

    return response.status(200).send(result);
  }

  async store({ request, response }) {
    const query = new Page();

    query.name = request.input("name");
    query.slug = request.input("slug");
    query.details = request.input("details");
    query.html = request.input("html");
    query.type = request.input("type");

    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, request, response, view }) {
    const query = await Page.findOrFail(params.id);
    return response.status(200).send(query);
  }
  async showBySlug({ params, request, response, view }) {
    const query = await Page.findByOrFail("slug", params.id);
    return response.status(200).send(query);
  }

  async update({ params, request, response }) {
    const query = await Page.findOrFail(params.id);

    query.name = request.input("name");
    query.slug = request.input("slug");
    query.details = request.input("details");
    query.html = request.input("html");
    query.type = request.input("type");

    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, request, response }) {
    const query = await Page.findOrFail(params.id);
    const result = await query.delete();
    let message;
    if (result) {
      message = "Delete successfully";
    } else {
      message = "Delete failed";
    }
    return response.status(200).send({ message: message });
  }
}

module.exports = PageController;
