"use strict";

const Category = use("App/Models/Admin/ProductModule/Category");
const Module = use("App/Models/Admin/ProductModule/Module");
const CategoryDocument = use("App/Models/Admin/ProductModule/CategoryDocument");
const ModuleRole = use("App/Models/Admin/UserModule/ModuleRole");
const CategoryRole = use("App/Models/Admin/UserModule/CategoryRole");
const Query = use("Query");
const moment = require("moment");
const searchInFields = ["id", "name", "sort_order", "detail"];
class CategoryController {
  async index({ request, response, view, auth }) {
    const query = Category.query();

    const role_id = auth.user.role_id;

    const module_ids = await ModuleRole.query()
      .where("role_id", role_id)
      .pluck("module_id");

    const categoy_ids = await CategoryRole.query()
      .where("role_id", role_id)
      .pluck("category_id");

    let filterCategories = [];
    if (module_ids && module_ids.length > 0) {
      const category_ids = await Module.query()
        .whereIn("id", module_ids)
        .groupBy("category_id")
        .pluck("category_id");
      filterCategories = [...category_ids];
      // query.whereIn("id", category_ids);
    }

    if (categoy_ids && categoy_ids.length) {
      categoy_ids.map((id) => {
        if (!filterCategories.includes(id)) {
          filterCategories.push(id);
        }
      });
    }

    if (filterCategories.length) {
      query.whereIn("id", filterCategories);
    } else {
      query.whereIn("id", ["-1"]);
    }

    const not_categories = request.input("not_categories");
    if (not_categories) {
      query.whereNotIn("id", JSON.parse(not_categories));
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
  async indexAll({ request, response, view, auth }) {
    const query = Category.query();

    const role_id = auth.user.role_id;

    const module_ids = await ModuleRole.query()
      .where("role_id", role_id)
      .pluck("module_id");

    const categoy_ids = await CategoryRole.query()
      .where("role_id", role_id)
      .pluck("category_id");

    let filterCategories = [];
    if (module_ids && module_ids.length > 0) {
      let category_ids = await Module.query()
        .whereIn("id", module_ids)
        .groupBy("category_id")
        .pluck("category_id");
      if (parseInt(role_id) === 1) {
        category_ids = [...category_ids, 5];
      }
      filterCategories = [...category_ids];
    }

    if (categoy_ids && categoy_ids.length) {
      categoy_ids.map((id) => {
        if (!filterCategories.includes(id)) {
          filterCategories.push(id);
        }
      });
    }

    if (filterCategories.length) {
      query.whereIn("id", filterCategories);
    } else {
      query.whereIn("id", ["-1"]);
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

  async storeDocuments(id, request) {
    await CategoryDocument.query().where("category_id", id).delete();

    if (request.input("documents")) {
      let data = [];
      const documents = JSON.parse(request.input("documents"));
      documents.forEach((value) => {
        data.push({
          category_id: id,
          document_id: value,
        });
      });
      await CategoryDocument.createMany(data);
    }
  }

  async store({ request, response }) {
    const query = new Category();
    query.name = request.input("name");
    query.color = request.input("color") ? request.input("color") : "#000000";
    query.header_color = request.input("header_color")
      ? request.input("header_color")
      : "#000000";
    query.bg_color = request.input("bg_color")
      ? request.input("bg_color")
      : "#000000";
    query.bg_image = request.input("bg_image");
    query.image = request.input("image");
    query.no_flow = request.input("no_flow");
    query.sort_order = request.input("sort_order");
    query.detail = request.input("detail");
    await query.save();
    this.storeDocuments(query.id, request);
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, request, response, view }) {
    const query = Category.query();
    query.where("id", params.id);
    const result = await query.first();
    const documentsIds = await result.documents().ids();
    result.documents = documentsIds;
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await Category.findOrFail(params.id);
    query.name = request.input("name");
    query.color = request.input("color") ? request.input("color") : "#000000";
    query.header_color = request.input("header_color")
      ? request.input("header_color")
      : "#000000";
    query.bg_color = request.input("bg_color")
      ? request.input("bg_color")
      : "#000000";
    query.bg_image = request.input("bg_image");
    query.image = request.input("image");
    query.no_flow = request.input("no_flow");
    query.sort_order = request.input("sort_order");
    query.detail = request.input("detail");
    await query.save();
    this.storeDocuments(query.id, request);
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, request, response }) {
    const query = await Category.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({ message: "Something went wrong" });
    }
  }

  async documents({ params, request, response }) {
    const query = CategoryDocument.query();
    //Document Category => 1: Module Documents, 2: Template Toolkit Documents
    query.where("document_cateogry", 2);
    const result = await query.fetch();
    return response.status(200).send(result);
  }
}

module.exports = CategoryController;
