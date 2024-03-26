"use strict";
const Module = use("App/Models/Admin/ProductModule/Module");
const Category = use("App/Models/Front/ProductModule/Category");
const VisitorGroup = use("App/Models/Admin/VisitorModule/VisitorGroup");
const _ = require("lodash");
const MarketPlan = use("App/Models/MarketPlan");
const Subcription = use("App/Models/Subcription");
const moment = require("moment");
const { getUserSubscribtions } = require("../../../../Helper/userSubscription");
const { MI_CONFIG } = require("../../../../Helper/constants");
const MISegment = use("App/Models/Admin/MISegmentModule/MISegment");

class ModuleController {
  async index({ request, response }) {
    const where = ["name"];
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderPos = request.input("orderPos");

    const query = Module.query();

    query.select("modules.*");
    query.select("categories.name as category");
    query.select("parent.name as parent");
    query.select("flows.name as flow");

    if (orderBy && orderPos) {
      query.orderBy(`modules.${orderBy}`, orderPos);
    }
    if (search) {
      where.forEach((filed) => {
        query.whereRaw(`modules.${filed} LIKE '%${search}%'`);
      });
    }

    if (request.input("category_id")) {
      query.where("modules.category_id", request.input("category_id"));
    }

    if (request.input("seo_url_slug")) {
      query.where("modules.seo_url_slug", request.input("seo_url_slug"));
    }

    if (request.input("only_parent")) {
      query.where("modules.parent_id", null);
    }

    if (request.input("parent_id")) {
      query.where("modules.parent_id", request.input("parent_id"));
    }

    if (request.input("flow_added")) {
      query.whereNot("flows.name", "=", "null");
    }

    query.leftJoin("flows", "flows.module_id", "modules.id");
    query.leftJoin("categories", "categories.id", "modules.category_id");
    query.leftJoin("modules as parent", "parent.id", "modules.parent_id");

    query.where("modules.status", true);

    const result = await query.fetch();

    return response.status(200).send(result);
  }

  async indexauth({ request, response, auth }) {
    const where = ["id", "category_id", "name"];

    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderPos = request.input("orderPos");

    const query = Module.query();

    query.select("modules.*");
    query.select("categories.name as category");
    query.select("parent.name as parent");
    query.select("flows.name as flow");

    if (orderBy && orderPos) {
      query.orderBy(`modules.${orderBy}`, orderPos);
    }
    if (search) {
      where.forEach((filed) => {
        query.whereRaw(`modules.${filed} LIKE '%${search}%'`);
      });
    }

    if (request.input("category_id")) {
      query.where("modules.category_id", request.input("category_id"));
    }

    if (request.input("only_parent")) {
      query.where("modules.parent_id", null);
    }

    if (request.input("parent_id")) {
      query.where("modules.parent_id", request.input("parent_id"));
    }

    if (request.input("flow_added")) {
      query.whereNot("flows.name", "=", "null");
    }

    query.leftJoin("flows", "flows.module_id", "modules.id");
    query.leftJoin("categories", "categories.id", "modules.category_id");
    query.leftJoin("modules as parent", "parent.id", "modules.parent_id");

    query.where("modules.status", true);

    const result = await query.fetch();

    return response.status(200).send(result);
  }

  async checkPermission({ params, response, auth }) {
    const visitor = await auth.authenticator("visitorAuth").getUser();
    let moduleIds = [];
    if (visitor.visitor_group_id) {
      const visitorGroupQuery = VisitorGroup.query();
      visitorGroupQuery.where("id", visitor.visitor_group_id);
      const result = await visitorGroupQuery.first();
      moduleIds = await result.modules().ids();
    }
    if (moduleIds.includes(Number(params.id))) {
      return response.status(200).send({ message: "Go Ahead" });
    } else {
      return response.status(403).send({
        message:
          "Access to this content is restricted. Please contact inquiries@itmap.com",
      });
    }
  }

  async show({ params, response }) {
    const query = await Module.query()
      .select("modules.*")
      .select("p.name as parent")
      .select("c.name as category")
      .leftJoin("modules as p", "p.id", "modules.parent_id")
      .leftJoin("categories as c", "c.id", "modules.category_id")
      .where("modules.id", params.id)
      .where("modules.status", true)
      .firstOrFail();
    return response.status(200).send(query);
  }

  async children({ request, response }) {
    const query = Module.query();
    query.select("modules.*");
    query.select("flows.name as flow");
    query.with("children.children.children.children");

    query.leftJoin("flows", "flows.module_id", "modules.id");

    if (request.input("category_id")) {
      query.where("modules.category_id", request.input("category_id"));
    }
    query.where("modules.status", true);
    query.where("modules.parent_id", null);
    if (request.input("flow_added")) {
      query.whereNot("flows.name", "=", "null");
    }

    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async childrenauth({ request, response, auth }) {
    const query = Module.query();
    query.select("modules.*");
    query.select("flows.name as flow");
    query.with("children.children.children.children");

    query.leftJoin("flows", "flows.module_id", "modules.id");

    if (request.input("category_id")) {
      query.where("modules.category_id", request.input("category_id"));
    }
    query.where("modules.status", true);
    query.where("modules.parent_id", null);
    if (request.input("flow_added")) {
      query.whereNot("flows.name", "=", "null");
    }

    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async categories({ request, response, auth }) {
    const query = Category.query();
    const not_categories = request.input("not_categories");
    if (not_categories) query.whereNotIn("id", JSON.parse(not_categories));
    query.with("children.children.children.children.children");
    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async categoriesSubscribed({ auth, request, response }) {
    const query = Category.query();
    let segment_id = request.input("segment_id");
    let modules = [];

    if (!segment_id) return response.status(200).send({ data: modules });
    const mi_segment = await MISegment.findOrFail(segment_id);
    if (MI_CONFIG[segment_id].module_subscription) {
      const user = await auth.authenticator("investorAuth").getUser();
      const { allowedModules } = await getUserSubscribtions(
        user.id,
        segment_id
      );
      modules = allowedModules;
    }

    const not_categories = request.input("not_categories");
    if (not_categories) query.whereNotIn("id", JSON.parse(not_categories));
    query.with("children.children.children.children.children");
    const result = await query.fetch();
    if (MI_CONFIG[segment_id].module_subscription) {
      return response
        .status(200)
        .send(this.filterCategory(result.toJSON(), modules));
    } else {
      return response.status(200).send(result);
    }
  }

  async categoriesForSubscription({ request, response }) {
    const query = Category.query();
    const plan_id = request.input("plan_id");
    const not_categories = request.input("not_categories");
    if (not_categories) query.whereNotIn("id", JSON.parse(not_categories));
    query.with("children.children.children.children.children");
    const result = await query.fetch();

    const marketPlanResult = await MarketPlan.findOrFail(plan_id);
    const modulesIds = await marketPlanResult.modules().ids();

    return response
      .status(200)
      .send(this.filterCategory(result.toJSON(), modulesIds));
  }

  filterCategory(data, ids) {
    let result = _.filter(data, (item) => {
      if (item.children && item.children.length) {
        item.children = this.filterCategory(item.children, ids);
        return item.children.length ? true : false;
      } else {
        return ids.includes(item.id) ? true : false;
      }
    });
    return result;
  }

  async parent({ request, response }) {
    const query = Module.query();
    query.with("parent.parent.parent.parent");

    if (request.input("category_id")) {
      query.where("category_id", request.input("category_id"));
    }
    if (request.input("module_id")) {
      query.where("id", request.input("module_id"));
    }

    // query.where('parent_id', null)

    query.where("status", true);
    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async parentauth({ request, response, auth }) {
    const query = Module.query();
    query.with("parent.parent.parent.parent");

    if (request.input("category_id")) {
      query.where("category_id", request.input("category_id"));
    }
    if (request.input("module_id")) {
      query.where("id", request.input("module_id"));
    }

    // query.where('parent_id', null)

    query.where("status", true);
    const result = await query.fetch();
    return response.status(200).send(result);
  }
}

module.exports = ModuleController;
