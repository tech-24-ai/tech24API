"use strict";
const Partner = use("App/Models/Admin/PartnerModule/Partner");
const PartnerType = use("App/Models/Admin/PartnerModule/PartnerType");
const PartnerModule = use("App/Models/Admin/PartnerModule/ModulePartner");
const PartnerVendors = use("App/Models/Admin/PartnerModule/VendorsPartners");
const PartnerCountry = use("App/Models/Admin/PartnerModule/CountriesPartners");
const Query = use("Query");
const moment = require("moment");
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */
const { getUserSubscribtions } = require("../../../../Helper/userSubscription");

const searchInFields = ["id", "name", "website"];

const requestOnly = [
  "name",
  "website",
  "image",
  "country_id",
  "itmap_rating",
  "org_size",
  "partner_type_id",
];
/**
 * Resourceful controller for interacting with partnerlists
 */
class PartnerListController {
  /**
   * Show a list of all partnerlists.
   * GET partnerlists
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, auth }) {
    const query = Partner.query();
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    let countries = request.input("countries");
    let org_size = request.input("org_size");
    let partner_types = request.input("partner_types");
    const user = await auth.authenticator("investorAuth").getUser();
    const { allowedCountries } = await getUserSubscribtions(user.id, 5);

    if (request.input("start_date") && request.input("end_date")) {
      query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
      query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    }

    query.with("modules");
    query.with("vendors");
    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    {
      const partnerCountryQuery = PartnerCountry.query();
      if (countries)
        partnerCountryQuery.whereIn("country_id", JSON.parse(countries));
      else partnerCountryQuery.whereIn("country_id", allowedCountries);
      let partnerids = await partnerCountryQuery.pluck("partner_id");
      query.whereIn("id", partnerids);
    }

    if (request.input("modules")) {
      let modules = request.input("modules")
        ? JSON.parse(request.input("modules"))
        : [];
      modules = [...modules];
      const partnerModuleQuery = PartnerModule.query();
      partnerModuleQuery.whereIn("module_id", modules);
      let partnerids = await partnerModuleQuery.pluck("partner_id");
      query.whereIn("id", partnerids);
    }
    if (request.input("vendors")) {
      const vendors = JSON.parse(request.input("vendors"));
      const partnerVendorsQuery = PartnerVendors.query();
      partnerVendorsQuery.whereIn("vendor_id", vendors);
      let partnerids = await partnerVendorsQuery.pluck("partner_id");
      query.whereIn("id", partnerids);
    }

    if (org_size) query.whereIn("partners.org_size", JSON.parse(org_size));

    if (partner_types)
      query.whereIn("partners.partner_type_id", JSON.parse(partner_types));

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

  async PartnerTypes({ request, response, view }) {
    const query = PartnerType.query();
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
}

module.exports = PartnerListController;
