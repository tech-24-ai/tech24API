"use strict";
const ConsultantTechnology = use(
  "App/Models/Admin/ConsultantModule/ConsultantTechnology"
);
const Query = use("Query");
const moment = require("moment");
const { getProfile } = require("../../../../Helper/consultant");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");

const requestOnly = ["name", "status"];
const searchInFields = ["name"];
const selectFields = ["id", "consultant_id", "name", "status", "created_at"];

class ConsultantTechnologyController {
  async index({ request, response, view, auth }) {
    const query = ConsultantTechnology.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const consultantId = request.input("consultant_id");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    const user = await getProfile(auth);
    query.with("consultant", (builder) => {
      builder.select("id", "first_name", "middle_name", "last_name");
    });

    query.select(selectFields);

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          case "updated_at":
            query.whereRaw(
              await dateFilterExtractor({
                name: "created_at",
                date: filter.value,
              })
            );
            break;
          default:
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    // if consultant not logged in
    if (consultantId && user.consultant_id == undefined) {
      query.where("consultant_id", consultantId);
    }
    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
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

  async store({ request, response, auth }) {
    const body = request.only(requestOnly);
    const user = await getProfile(auth);
    const query = await ConsultantTechnology.create({
      ...body,
      created_by: user.id,
      updated_by: user.id,
      consultant_id: user.consultant_id
        ? user.consultant_id
        : request.input("consultant_id"),
    });
    await query.save();
    return response.status(200).json({
      message: "Create successfully",
    });
  }

  async show({ params, request, response, view, auth }) {
    const query = ConsultantTechnology.query();
    const user = await getProfile(auth);
    query.where("id", params.id);
    // if consultant logged in
    if (user.consultant_id) {
      query.where("consultant_id", user.consultant_id);
    }
    query.with("consultant", (builder) => {
      builder.select("id", "first_name", "middle_name", "last_name");
    });
    query.select(selectFields);
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async update({ params, request, response, auth }) {
    const body = request.only(requestOnly);
    const query = await ConsultantTechnology.findOrFail(params.id);
    query.updated_by = auth.user.id;
    query.merge(body);
    query.save();
    return response.status(200).json({ message: "Update successfully" });
  }

  async destroy({ params, request, response }) {
    const query = await ConsultantTechnology.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).json({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).json({ message: "Something went wrong" });
    }
  }

  async technologies({ request, response, view, auth }) {
    const query = ConsultantTechnology.query();
    query.select("id", "name as label");
    query.groupBy("name");
    const result = await query.fetch();

    return response.status(200).send(result);
  }
}

module.exports = ConsultantTechnologyController;
