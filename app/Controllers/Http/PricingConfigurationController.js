"use strict";
const Database = use("Database");
const PricingConfiguration = use("App/Models/PricingConfiguration");
const Category = use('App/Models/Admin/ProductModule/Category')

const PricingCongfigurationRegionMapping = use(
  "App/Models/PricingCongfigurationRegionMapping"
);
const PricingConfigurationPriceMapping = use(
  "App/Models/PricingConfigurationPriceMapping"
);
const Query = use("Query");
const moment = require("moment");

const searchInFields = ["id", "name", "notes", "unit", "graph_y_label"];

const requestOnly = [
  "name",
  "category_id",
  "module_id",
  "unit",
  "graph_y_label",
  "pricing_model_id",
  "notes",
];

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with pricingconfigurations
 */
class PricingConfigurationController {
  /**
   * Show a list of all pricingconfigurations.
   * GET pricingconfigurations
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {
    const query = PricingConfiguration.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    query.with("modules");
    query.with("pricingModels");
    query.with("categories");

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    var categorynamefilter = "";

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "categories.name":
            categorynamefilter = filter.value;
            break;
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
            let queryStr = "";
            if (Array.isArray(filter.value)) {
              filter.value.forEach((x) => {
                if (queryStr != "") queryStr += " or ";
                queryStr += `${filter.name} LIKE '%${x}%'`;
              });
            } else {
              queryStr = `${filter.name} LIKE '%${filter.value}%'`;
            }
            query.whereRaw(queryStr);
            break;
        }
      });
    }

    
    if (categorynamefilter.length > 0) {
      const categoryids = await Category.query().whereRaw(`name LIKE '%${categorynamefilter}%'`).pluck('id');
      if(categoryids.length>0) query.whereRaw('category_id in (?)', [categoryids]);
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

  /**
   * Render a form to be used for creating a new pricingconfiguration.
   * GET pricingconfigurations/create
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async create({ request, response, view }) {}

  /**
   * Create/save a new pricingconfiguration.
   * POST pricingconfigurations
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    const trx = await Database.beginTransaction();
    const query = new PricingConfiguration();

    try {
      query.name = request.input("name");
      query.category_id = request.input("category_id");
      query.module_id = request.input("module_id");
      query.unit = request.input("unit");
      query.graph_y_label = request.input("graph_y_label");
      query.pricing_model_id = request.input("pricing_model_id");
      query.notes = request.input("notes");
      await query.save(trx);

      let configs = request.input("configs");
      let configurationId = query.id;

      if (configs) {
        for (let conf of configs) {
          const queryPCRM = new PricingCongfigurationRegionMapping();

          queryPCRM.pricing_config_id = configurationId;

          if (conf.country_groups_id && conf.country_groups_id == 99999) {
            queryPCRM.country_groups_id = null;
            queryPCRM.has_all_country = "1";
          } else {
            queryPCRM.country_groups_id = conf.country_groups_id;
          }

          queryPCRM.year = conf.year;
          queryPCRM.deal_size = conf.deal_size;
          await queryPCRM.save(trx);

          let PCRMId = queryPCRM.id;

          for (let price of conf.prices) {
            const queryPCPM = new PricingConfigurationPriceMapping();

            queryPCPM.region_mapping_id = PCRMId;
            queryPCPM.avgprice = price.avgprice;
            queryPCPM.currencies_id = price.currencies_id;
            await queryPCPM.save(trx);
          }
        }
      } else {
        trx.rollback();
      }

      trx.commit();
      return response.status(200).send({ message: "Create successfully" });
    } catch (error) {
      trx.rollback();
      return response
        .status(423)
        .send({
          message: "Something went wrong",
        });
    }
  }

  /**
   * Display a single pricingconfiguration.
   * GET pricingconfigurations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response, view }) {
    const query = PricingConfiguration.query();

    query.where("id", params.id);
    query.with("modules");
    query.with("categories");
    query.with("pricingModels");

    const result = await query.firstOrFail();
    let AllConfigs = await PricingCongfigurationRegionMapping.query()
      .with("countryGroups")
      .whereIn("pricing_config_id", [params.id])
      .fetch();

    let ParsedAllConfigs = AllConfigs.toJSON();

    for (let config of ParsedAllConfigs) {
      let configId = config.id;
      config.prices = await PricingConfigurationPriceMapping.query()
        .whereIn("region_mapping_id", [configId])
        .fetch();
    }

    result.configs = ParsedAllConfigs;

    return response.status(200).send(result);
  }

  /**
   * Render a form to update an existing pricingconfiguration.
   * GET pricingconfigurations/:id/edit
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async edit({ params, request, response, view }) {}

  /**
   * Update pricingconfiguration details.
   * PUT or PATCH pricingconfigurations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    const query = await PricingConfiguration.findOrFail(params.id);
    const trx = await Database.beginTransaction();

    query.name = request.input("name");
    query.category_id = request.input("category_id");
    query.module_id = request.input("module_id");
    query.unit = request.input("unit");
    query.graph_y_label = request.input("graph_y_label");
    query.pricing_model_id = request.input("pricing_model_id");
    query.notes = request.input("notes");

    try {
      let AllConfigs = await PricingCongfigurationRegionMapping.query()
        .whereIn("pricing_config_id", [params.id])
        .fetch();
      let ParsedAllConfigs = AllConfigs.toJSON();

      for (let config of ParsedAllConfigs) {
        let configId = config.id;

        await PricingConfigurationPriceMapping.query()
          .whereIn("region_mapping_id", [configId])
          .delete(trx);

        const queryPCRM = await PricingCongfigurationRegionMapping.findOrFail(
          configId
        );
        await queryPCRM.delete(trx);
      }

      let configs = request.input("configs");
      if (configs) {
        for (let conf of configs) {
          const queryPCRM = new PricingCongfigurationRegionMapping();

          queryPCRM.pricing_config_id = params.id;

          if (conf.country_groups_id && conf.country_groups_id == 99999) {
            queryPCRM.country_groups_id = null;
            queryPCRM.has_all_country = "1";
          } else {
            queryPCRM.country_groups_id = conf.country_groups_id;
          }

          queryPCRM.year = conf.year;
          queryPCRM.deal_size = conf.deal_size;
          await queryPCRM.save(trx);

          let PCRMId = queryPCRM.id;

          for (let price of conf.prices) {
            const queryPCPM = new PricingConfigurationPriceMapping();

            queryPCPM.region_mapping_id = PCRMId;
            queryPCPM.avgprice = price.avgprice;
            queryPCPM.currencies_id = price.currencies_id;
            await queryPCPM.save(trx);
          }
        }
      } else {
        trx.rollback();
      }
      await query.save(trx);
      trx.commit();
      return response.status(200).send({ message: "Update successfully" });
    } catch (error) {
      trx.rollback();
      return response
        .status(423)
        .send({
          message: "Something went wrong",
        });
    }
  }

  /**
   * Delete a pricingconfiguration with id.
   * DELETE pricingconfigurations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const query = await PricingConfiguration.findOrFail(params.id);
    const trx = await Database.beginTransaction();

    try {
      let AllConfigs = await PricingCongfigurationRegionMapping.query()
        .whereIn("pricing_config_id", [params.id])
        .fetch();
      let ParsedAllConfigs = AllConfigs.toJSON();

      for (let config of ParsedAllConfigs) {
        let configId = config.id;

        await PricingConfigurationPriceMapping.query()
          .whereIn("region_mapping_id", [configId])
          .delete(trx);

        const queryPCRM = await PricingCongfigurationRegionMapping.findOrFail(
          configId
        );
        await queryPCRM.delete(trx);
      }

      await query.delete(trx);
      trx.commit();

      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      trx.rollback();
      return response
        .status(423)
        .send({
          message: "Something went wrong",
        });
    }
  }
}

module.exports = PricingConfigurationController;
