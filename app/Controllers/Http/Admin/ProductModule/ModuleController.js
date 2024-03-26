"use strict";

const Module = use("App/Models/Admin/ProductModule/Module");
const Flow = use("App/Models/Admin/ProductModule/Flow");
const ModuleDocument = use("App/Models/Admin/DocumentModule/ModuleDocument");
const ModuleRole = use("App/Models/Admin/UserModule/ModuleRole");
const { dateFilterExtractor } = require("../../../../Helper/globalFunctions");

const Query = use("Query");
const moment = require("moment");
const searchInFields = ["modules.id", "modules.name", "modules.about"];
class ModuleController {
  async index({ request, response, auth }) {
    const query = Module.query();

    query.select("modules.*");
    query.select("categories.name as category");
    query.select("parent.name as parent");
    query.select("flows.name as flow");

    if (request.input("category_id")) {
      query.where("modules.category_id", request.input("category_id"));
    }
    if (request.input("parent_id")) {
      query.where("modules.parent_id", request.input("parent_id"));
    }
    if (request.input("status")) {
      query.where("modules.status", request.input("status"));
    }
    if (request.input("only_parent")) {
      query.where("modules.parent_id", null);
    }
    if (request.input("flow_added")) {
      query.whereNot("flows.name", "=", "null");
    }
    if (request.input("flow_not_added")) {
      query.where("flows.name", null);
    }

    const role_id = auth.user.role_id;

    const module_ids = await ModuleRole.query()
      .where("role_id", role_id)
      .pluck("module_id");

    if (module_ids && module_ids.length > 0) {
      query.where((q) => {
        q.whereIn("modules.id", module_ids);
        q.orWhereIn("categories.id", [1]);
      });
    } else {
      query.orWhereIn("categories.id", [1]);
    }

    query.leftJoin("flows", "flows.module_id", "modules.id");
    query.leftJoin("categories", "categories.id", "modules.category_id");
    query.leftJoin("modules as parent", "parent.id", "modules.parent_id");

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(
        `DATE(modules.created_at) >= '${request.input("start_date")}'`
      );
      query.whereRaw(
        `DATE(modules.created_at) <= '${request.input("end_date")}'`
      );
    }

    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }
    query.orderBy("id", "asc");

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }
    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach(async (filter) => {
        if (filter.name == "category") {
          query.whereRaw(`categories.name LIKE '%${filter.value}%'`);
        } else if (filter.name == "parent") {
          query.whereRaw(`parent.name LIKE '%${filter.value}%'`);
        } else if (filter.name == "status") {
          query.whereIn("modules.status", filter.value);
        } else if (filter.name == "flow") {
          query.whereRaw(`flows.name LIKE '%${filter.value}%'`);
        } else if (filter.name == "created_at") {
          const date = await dateFilterExtractor({
            name: `modules.${filter.name}`,
            date: filter.value,
          });
          query.whereRaw(date);
        } else {
          query.whereRaw(`modules.${filter.name} LIKE '%${filter.value}%'`);
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
    await ModuleDocument.query().where("module_id", id).delete();

    if (request.input("documents")) {
      let data = [];
      const documents = JSON.parse(request.input("documents"));
      documents.forEach((value) => {
        data.push({
          module_id: id,
          document_id: value,
        });
      });
      await ModuleDocument.createMany(data);
    }
  }

  async store({ request, response }) {
    const query = new Module();
    query.category_id = request.input("category_id");
    query.parent_id = request.input("parent_id");
    query.name = request.input("name");
    query.about = request.input("about");
    query.notes = request.input("notes");
    query.report_notes = request.input("report_notes");
    query.min_price = request.input("min_price");
    query.max_price = request.input("max_price");
    query.status = request.input("status");
    query.seo_url_slug = request.input("seo_url_slug");
    query.meta_description = request.input("meta_description");
    query.meta_keywords = request.input("meta_keywords");
    query.meta_title = request.input("meta_title");

    await query.save();
    this.storeDocuments(query.id, request);
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, response }) {
    const query = Module.query();
    query.select("modules.*");
    query.select("parent.name as parent");
    query.select("categories.name as category");
    query.leftJoin("modules as parent", "parent.id", "modules.parent_id");
    query.leftJoin("categories", "categories.id", "modules.category_id");
    query.where("modules.id", params.id);
    const result = await query.first();
    const documentsIds = await result.documents().ids();
    result.documents = documentsIds;
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await Module.findOrFail(params.id);
    query.category_id = request.input("category_id");
    query.parent_id = request.input("parent_id");
    query.name = request.input("name");
    query.about = request.input("about");
    query.notes = request.input("notes");
    query.report_notes = request.input("report_notes");
    query.min_price = request.input("min_price");
    query.max_price = request.input("max_price");
    query.status = request.input("status");
    query.seo_url_slug = request.input("seo_url_slug");
    query.meta_description = request.input("meta_description");
    query.meta_keywords = request.input("meta_keywords");
    query.meta_title = request.input("meta_title");
    await query.save();
    this.storeDocuments(query.id, request);
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await Module.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response
        .status(423)
        .send({ message: "Please unlink your module on where module assign" });
    }
  }

  async documents({ response }) {
    const query = ModuleDocument.query();
    //Document Category => 1: Module Documents, 2: Template Toolkit Documents
    query.where("document_cateogry", 1);
    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async modulesWithFlow({ request, response, auth }) {
    const query = Module.query();

    query.select("modules.*");
    query.select("categories.name as category");
    query.select("flows.name as flow");
    query.select("parent.name as parent");

    const role_id = auth.user.role_id;

    const module_ids = await ModuleRole.query()
      .where("role_id", role_id)
      .pluck("module_id");

    if (module_ids && module_ids.length > 0) {
      query.whereIn("id", module_ids);
    }

    if (request.input("category_id")) {
      query.where("modules.category_id", request.input("category_id"));
    }
    if (request.input("parent_id")) {
      query.where("modules.parent_id", request.input("parent_id"));
    }
    if (request.input("only_parent")) {
      query.where("modules.parent_id", null);
    }

    query.leftJoin("categories", "categories.id", "modules.category_id");
    query.leftJoin("flows", "flows.module_id", "modules.id");
    query.leftJoin("modules as parent", "parent.id", "modules.parent_id");
    query.whereNot("flows.name", "=", "null");

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

  async childrenWithoutFlow({ request, response }) {
    const query = Module.query();
    const flowQuery = Flow.query();
    const moduleIds = await flowQuery.pluck("module_id");

    if (request.input("category_id")) {
      query.where("category_id", request.input("category_id"));
    }
    query.where("parent_id", null);

    query.with("children", (children1) => {
      if (!request.input("edit")) {
        children1.whereNotIn("id", moduleIds);
      }
      children1.with("children", (children2) => {
        if (!request.input("edit")) {
          children2.whereNotIn("id", moduleIds);
        }
        children2.with("children", (children3) => {
          if (!request.input("edit")) {
            children3.whereNotIn("id", moduleIds);
          }
          children3.with("children", (children4) => {
            if (!request.input("edit")) {
              children4.whereNotIn("id", moduleIds);
            }
            children4.with("children", (children5) => {
              if (!request.input("edit")) {
                children5.whereNotIn("id", moduleIds);
              }
              children5.with("children", (children6) => {
                if (!request.input("edit")) {
                  children6.whereNotIn("id", moduleIds);
                }
              });
            });
          });
        });
      });
    });

    if (!request.input("edit")) {
      query.whereNotIn("id", moduleIds);
    }
    const result = await query.fetch();
    return response.status(200).send(result);
  }
}

module.exports = ModuleController;
