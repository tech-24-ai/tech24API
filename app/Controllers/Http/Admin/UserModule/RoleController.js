"use strict";

const Role = use("App/Models/Admin/UserModule/Role");
const ModuleRole = use("App/Models/Admin/UserModule/ModuleRole");
const PermissionRole = use("App/Models/Admin/UserModule/PermissionRole");
const Module = use("App/Models/Admin/ProductModule/Module");
const Query = use("Query");
const moment = require("moment");
const searchInFields = ["id", "name"];

class RoleController {
  async index({ request, response }) {
    const query = Role.query();

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

  async storeRoles(id, request) {
    await PermissionRole.query().where("role_id", id).delete();

    if (request.input("permissions")) {
      var data = [];
      const permissions = JSON.parse(request.input("permissions"));
      permissions.forEach((value) => {
        data.push({
          role_id: id,
          permission_id: value,
        });
      });
      await PermissionRole.createMany(data);
    }
  }

  async store({ request, response }) {
    // const query = new Role();
    const query = await Role.create({
      name: request.input("name"),
    });
    // query.name = request.input("name");

    // this is for adding parent_id, updated on 24-08-2022
    var moduleArray = [];
    JSON.parse(request.input("modules")).map(async (e) => {
      const { parent_id } = await Module.findOrFail(e);
      if (parent_id && !moduleArray.includes(parent_id)) {
        moduleArray.push(parent_id);
      }
      if (!moduleArray.includes(e)) {
        moduleArray.push(e);
      }
    });
    // End this is for adding parent_id, updated on 24-08-2022

    await query.permissions().detach();
    await query.permissions().attach(JSON.parse(request.input("permissions")));

    await query.modules().detach();
    // await query.modules().attach(JSON.parse(request.input("modules")));
    await query.modules().attach(moduleArray);
    await query.save();

    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, response }) {
    const query = Role.query();
    query.where("id", params.id);
    const result = await query.first();
    const permissionIds = await result.permissions().ids();
    result.permissions = permissionIds;

    const moduleIds = await result.modules().ids();
    // result.modules = moduleIds;
    const categoryIds = await result.categories().ids();
    const newId = categoryIds.map((cid) => `category-${cid}`);
    result.modules = [...moduleIds, ...newId];
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    const query = await Role.findOrFail(params.id);
    query.name = request.input("name");

    // this is for adding parent_id, updated on 24-08-2022
    var moduleArray = [];
    var categoryArray = [];
    JSON.parse(request.input("modules")).map(async (e) => {
      if (typeof e === "string" && e.includes("category")) {
        // this is for adding category_id, updated on 13-12-2022
        const categoryId = e.substring(9); //removing 'category-' from value
        if (!categoryArray.includes(categoryId)) {
          categoryArray.push(categoryId);
        }
      } else {
        const { parent_id } = await Module.findOrFail(e);
        if (parent_id && !moduleArray.includes(parent_id)) {
          moduleArray.push(parent_id);
        }
        if (!moduleArray.includes(e)) {
          moduleArray.push(e);
        }
      }
    });

    // End this is for adding parent_id, updated on 24-08-2022

    await query.permissions().detach();
    await query.permissions().attach(JSON.parse(request.input("permissions")));

    await query.modules().detach();
    // await query.modules().attach(JSON.parse(request.input("modules")));
    await query.modules().attach(moduleArray);

    await query.categories().detach();
    await query.categories().attach(categoryArray);
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await Role.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({ message: "Something went wrong" });
    }
  }

  async permissions({ response }) {
    const query = PermissionRole.query();
    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async modules({ response }) {
    const query = ModuleRole.query();
    const result = await query.fetch();
    return response.status(200).send(result);
  }
}

module.exports = RoleController;
