"use strict";
const Excel = require("exceljs");
const Database = use("Database");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const IndustryVendor = use("App/Models/Admin/VendorModule/IndustryVendor");
const ModuleVendor = use("App/Models/Admin/VendorModule/ModuleVendor");
const VendorLocations = use("App/Models/Admin/VendorModule/VendorLocations");
const Invoice = use("App/Models/Invoice");
const VendorItmapScores = use(
  "App/Models/Admin/VendorModule/VendorItmapScores"
);
const Industry = use("App/Models/Admin/ProductModule/Industry");
const Module = use("App/Models/Admin/ProductModule/Module");
const CountryGroup = use("App/Models/Admin/LocationModule/CountryGroup");
const VendorCategory = use("App/Models/Admin/VendorModule/VendorCategory");
const Country = use("App/Models/Admin/LocationModule/Country");
const Query = use("Query");
const moment = require("moment");
const PartnerType = use("App/Models/Admin/PartnerModule/PartnerType");

const SearchReportProduct = use("App/Models/Report/SearchReportProduct");
const SearchReport = use("App/Models/Report/SearchReport");
const _ = require("lodash");
const { generatePdf, sendMail } = require("../../Helper/pdfGenerator");

const searchInFields = [
  "id",
  "name",
  "email",
  "mobile",
  "company",
  "website",
  "ticker",
  "company_type",
];

const requestOnly = [
  "name",
  "email",
  "mobile",
  "company",
  "website",
  "image",
  "notes",
  "ticker",
  "twitter_handle",
  "main_country",
  "is_login",
  "founded",
  "company_type",
];

class VendorController {
  async index({ request, response }) {
    const query = Vendor.query();
    query.with("industries");
    query.with("modules");
    query.with("locations.country.country_group");
    query.with("itmap_score");
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });

    if (request.input("category_id")) {
      query.where("vendor_category_id", request.input("category_id"));
    }

    if (request.input("category")) {
      query.whereIn(
        "vendor_category_id",
        JSON.parse(request.input("category"))
      );
    }

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("industries")) {
      let industries = JSON.parse(request.input("industries"));
      //Todo -  Need to check with Vandan/Ajay as we storing only parent__id
      const parent_id = await Industry.query()
        .whereIn("id", industries)
        .pluck("parent_id");
      industries = [...industries, ...parent_id];
      // Todo end
      const industryVendorQuery = IndustryVendor.query();
      industryVendorQuery.whereIn("industry_id", industries);
      let vendorIds = await industryVendorQuery.pluck("vendor_id");

      query.whereIn("id", vendorIds);
    }

    if (request.input("modules")) {
      const modules = JSON.parse(request.input("modules"));

      const moduleVendorQuery = ModuleVendor.query();
      moduleVendorQuery.whereIn("module_id", modules);
      let vendorIds = await moduleVendorQuery.pluck("vendor_id");

      query.whereIn("id", vendorIds);
    }
    if (request.input("regions")) {
      const regions = JSON.parse(request.input("regions"));
      const vendorLocationsQuery = VendorLocations.query();
      vendorLocationsQuery.leftJoin(
        "countries",
        "countries.id",
        "vendor_locations.country_id"
      );
      vendorLocationsQuery.leftJoin(
        "country_groups",
        "country_groups.id",
        "countries.group_id"
      );
      vendorLocationsQuery.whereIn("country_groups.id", regions);
      let vendorIds = await vendorLocationsQuery.pluck(
        "vendor_locations.vendor_id"
      );
      query.whereIn("id", vendorIds);
    }

    if (request.input("itmap")) {
      const itmap = JSON.parse(request.input("itmap"));
      const itmapVendorQuery = VendorItmapScores.query();
      const itmap_results = await Database.raw(
        `select * from (select id,vendor_id,year ,overall_score,ROW_NUMBER() OVER(PARTITION BY vendor_id order by year desc) row_nn
        from vendor_itmap_scores
        group by vendor_id,year) as nes 
        where nes.row_nn = 1 and overall_score in (${itmap})`
      );
      const vendorIds =
        itmap_results[0] && itmap_results[0].length
          ? itmap_results[0].map((x) => x.vendor_id)
          : [];

      itmapVendorQuery.whereIn("overall_score", itmap);
      query.whereIn("id", vendorIds);
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

    // query.where('is_login', 1);

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

  async competitive({ params, request, response }) {
    const competitiveId = params.id;
    const query = Vendor.query();
    query.with("industries");
    query.with("modules");
    query.with("locations.country.country_group");
    query.with("itmap_score");
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const searchQuery = new Query(request, { order: "id" });
    const selfVendorId = request.input("selfVendorId");

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (competitiveId != 0) {
      query.where("vendor_category_id", competitiveId);
    }

    if (selfVendorId) {
      query.whereNot("id", "=", selfVendorId);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    if (request.input("industries")) {
      let industries = JSON.parse(request.input("industries"));
      //Todo -  Need to check with Vandan/Ajay as we storing only parent__id
      const parent_id = await Industry.query()
        .whereIn("id", industries)
        .pluck("parent_id");
      industries = [...industries, ...parent_id];
      // Todo end
      const industryVendorQuery = IndustryVendor.query();
      industryVendorQuery.whereIn("industry_id", industries);
      let vendorIds = await industryVendorQuery.pluck("vendor_id");

      query.whereIn("id", vendorIds);
    }

    if (request.input("modules")) {
      const modules = JSON.parse(request.input("modules"));

      const moduleVendorQuery = ModuleVendor.query();
      moduleVendorQuery.whereIn("module_id", modules);
      let vendorIds = await moduleVendorQuery.pluck("vendor_id");

      query.whereIn("id", vendorIds);
    }
    if (request.input("regions")) {
      const regions = JSON.parse(request.input("regions"));
      const vendorLocationsQuery = VendorLocations.query();
      vendorLocationsQuery.leftJoin(
        "countries",
        "countries.id",
        "vendor_locations.country_id"
      );
      vendorLocationsQuery.leftJoin(
        "country_groups",
        "country_groups.id",
        "countries.group_id"
      );
      vendorLocationsQuery.whereIn("country_groups.id", regions);
      let vendorIds = await vendorLocationsQuery.pluck(
        "vendor_locations.vendor_id"
      );
      query.whereIn("id", vendorIds);
    }

    if (request.input("itmap")) {
      const itmap = JSON.parse(request.input("itmap"));
      const itmapVendorQuery = VendorItmapScores.query();
      const itmap_results = await Database.raw(
        `select * from (select id,vendor_id,year ,overall_score,ROW_NUMBER() OVER(PARTITION BY vendor_id order by year desc) row_nn
        from vendor_itmap_scores
        group by vendor_id,year) as nes 
        where nes.row_nn = 1 and overall_score in (${itmap})`
      );
      const vendorIds =
        itmap_results[0] && itmap_results[0].length
          ? itmap_results[0].map((x) => x.vendor_id)
          : [];

      itmapVendorQuery.whereIn("overall_score", itmap);
      query.whereIn("id", vendorIds);
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

    // query.where('is_login', 1);

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

  async filterName({ request, response }) {
    let result = {
      industries: [],
      modules: [],
      regions: [],
      itmap: [],
      category: [],
    };
    if (request.input("industries")) {
      const industries = JSON.parse(request.input("industries"));
      const industryQuery = Industry.query();
      industryQuery.whereIn("id", industries);
      let names = await industryQuery.pluck("name");
      result.industries = names;
    }

    if (request.input("modules")) {
      const modules = JSON.parse(request.input("modules"));
      const modulequery = Module.query();
      modulequery.whereIn("id", modules);
      let names = await modulequery.pluck("name");
      result.modules = names;
    }

    if (request.input("regions")) {
      const regions = JSON.parse(request.input("regions"));
      const countryGroupQuery = CountryGroup.query();
      countryGroupQuery.whereIn("id", regions);
      let names = await countryGroupQuery.pluck("name");
      result.regions = names;
    }

    if (request.input("category")) {
      const category = JSON.parse(request.input("category"));
      const categoryQuery = VendorCategory.query();
      categoryQuery.whereIn("id", category);
      let names = await categoryQuery.pluck("name");
      result.category = names;
    }

    if (request.input("countries")) {
      const countries = JSON.parse(request.input("countries"));
      const countryGroupQuery = Country.query();
      countryGroupQuery.whereIn("id", countries);
      let names = await countryGroupQuery.pluck("name");
      result.countries = names;
    }

    if (request.input("itmap")) {
      const itmap = JSON.parse(request.input("itmap"));
      result.itmap = itmap.map((x) => `${x} Star`);
    }

    if (request.input("org_size")) {
      const org_size = JSON.parse(request.input("org_size"));
      result.org_size = org_size.map((x) => `${x}`);
    }

    if (request.input("partnerType")) {
      const modules = JSON.parse(request.input("partnerType"));
      const partnerQuery = PartnerType.query();
      partnerQuery.whereIn("id", modules);
      let names = await partnerQuery.pluck("name");
      result.partnerType = names;
    }

    return response.status(200).send(result);
  }
  async show({ request, params, response }) {
    const query = Vendor.query();
    query.where("id", params.id);
    query.with("industries");
    query.with("modules");
    query.with("itmap_score");
    query.with("locations.country");
    const result = await query.firstOrFail();
    const industriesIds = await result.industries().ids();
    result.industries = industriesIds;
    const modulesIds = await result.modules().ids();
    result.modules = modulesIds;
    const vendorLocationsQuery = VendorLocations.query();
    vendorLocationsQuery.where("vendor_id", params.id);
    const countryIds = await vendorLocationsQuery.pluck("country_id");
    const country_groupIds = await Country.query()
      .whereIn("id", countryIds)
      .distinct("group_id")
      .pluck("group_id");
    result.region = await CountryGroup.query()
      .whereIn("id", country_groupIds)
      .fetch();
    return response.status(200).send(result);
  }


  async createPdf({ request, response, auth }) {

    try {

      //console.log(user);
      const user = await auth.authenticator("investorAuth").getUser();
      var body = request.only(["type", "id", "data"]);
      let data = await generatePdf(body, user);
      return response.send(data);

    } catch (ex) {
      console.log(ex);
      return response.send({ "message": ex.message });
    }

  }

  async createinvoiceauth({ request, response, auth }) {

    try {
      const user = await auth.authenticator("investorAuth").getUser();
      //console.log(user);
      const invoiceQuery = await Invoice.findOrFail(request.input("id"));

      if (!invoiceQuery) {
        return response.send({ "message": "Invalid Invoice Number" });
      } else {

        var body = request.only(["type", "id", "data"]);
        let data = await generatePdf(body, user);
        return response.send(data);
      }
    } catch (ex) {
      console.log(ex);
      return response.send({ "message": "Invalid Invoice Number" });
    }

  }



  async sendEmail({ request, response, auth }) {
    try {
      const visitor = await auth.authenticator("investorAuth").getUser();
      var body = request.only(["type", "id", "data"]);
      await sendMail(body, visitor);
      return response.send({
        message: "Mail sent successfully",
      });
    } catch (ex) {
      return response.send({
        message: "Please login",
      });
    }
  }

  async showByName({ request, params, response }) {
    const query = Vendor.query();
    query.where("name", request.input("vendorName"));
    const result = await query.firstOrFail();
    return response.status(200).send(result);
  }

  async industries({ response }) {
    const query = IndustryVendor.query();
    const result = await query.fetch();
    return response.status(200).send(result);
  }
  async modules({ response }) {
    const query = ModuleVendor.query();
    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async profile({ params, response }) {
    const query = Vendor.query();
    query.where("vendors.id", params.id);
    query.with("industries");
    query.with("modules");
    query.with("itmap_score");
    query.with("locations.country");
    query.with("vendor_category");
    const query2 = Vendor.query();
    query2.select("countries.name");
    query2.leftJoin("countries", "countries.id", "vendors.main_country");
    const country = await query2.firstOrFail();
    const queryResult = await query.firstOrFail();
    const result = await queryResult.toJSON();
    let industries = "";

    if (result.industries) {
      const industriesNames = result.industries.map((result) => result.name);
      industries = industriesNames.join(", ");
    }

    result.details = [
      {
        name: "Founded",
        value: result.founded,
      },
      {
        name: "Company Type",
        value: result.company_type,
      },
      {
        name: "Vendor Category",
        value: result.vendor_category.name,
      },
      {
        name: "Industry",
        value: industries,
      },
      {
        name: "Specialities",
        value: result.company_type,
      },
      {
        name: "Headquarters",
        value: country.name,
      },
    ];

    return response.status(200).send(result);
  }

  async search({ request, response }) {
    let result = [];
    const query = Vendor.query();
    const searchQuery = new Query(request, { order: "id" });
    query.where(searchQuery.search(["name"]));
    result = await query.fetch();
    return response.status(200).send(result);
  }

  async buyersInterestMeta({ request, response }) {
    const queryReportProduct = SearchReportProduct.query();
    const querySearchReport = SearchReport.query();

    let result;
    let result2;
    let finalResult;

    let key = "vendor";
    let vendorVal = request.input("vendor");
    let queryStr = "";

    queryStr = `${key} LIKE '%${vendorVal}%'`;
    queryReportProduct.whereRaw(queryStr);
    result = await queryReportProduct.fetch();

    const data = await result.toJSON();
    let mappedData = data.map((value) => value.search_report_id);

    querySearchReport.whereIn("id", mappedData);
    querySearchReport.with("modules");

    result2 = await querySearchReport.fetch();
    const data2 = await result2.toJSON();

    let allModules = data2.map((res) => {
      return { name: res.modules.name, id: res.modules.id };
    });

    let allyears = data2.map((res) => {
      return moment(res.created_at, "MM/DD/YYYY").year();
    });

    let uniqueModules = _.uniqBy(allModules, "id");
    let uniqueYears = [...new Set(allyears)];

    finalResult = { modules: uniqueModules, years: uniqueYears };

    return response.status(200).send({ message: "success", data: finalResult });
  }

  async buyersInterest({ request, response }) {
    const queryReportProduct = SearchReportProduct.query();
    let result;
    let year = request.input("year");
    let moduleId = request.input("moduleId");
    let vendor = request.input("vendor");

    let totalLastSixMonthsMonthCount;
    let totalSecondLastSixMonthsMonthCount;
    let lastSixMonthGrowth;
    let lastYearGrowth;
    let totalLastYearCount;
    let totalSecondLastYearCount;
    let totalThirdLastYearCount;
    let lastTwoYearGrowth;
    let lastThreeYearGrowth;
    let totalFourthLastYearCount;

    queryReportProduct.whereRaw(
      `YEAR(search_report_products.created_at) = ${year}`
    );
    queryReportProduct.where("search_reports.module_id", moduleId);
    queryReportProduct.leftJoin(
      "search_reports",
      "search_reports.id",
      "search_report_products.search_report_id"
    );
    queryReportProduct.groupBy("name");

    result = await queryReportProduct.fetch();

    const parsedData = await result.toJSON();
    let groupedVendor = _.mapValues(_.groupBy(parsedData, "vendor"), (clist) =>
      clist.map((v) => _.omit(v, "vendor"))
    );

    let dataCount = {};
    for (let key in groupedVendor) {
      dataCount[key] = groupedVendor[key].length;
    }

    const sortable = Object.fromEntries(
      Object.entries(dataCount).sort(([, a], [, b]) => a - b)
    );

    let limitedVendors = {};

    if (Object.keys(sortable).length > 20) {
      limitedVendors[vendor] = sortable[vendor];

      for (let key in sortable) {
        if (key !== vendor) {
          limitedVendors[key] = sortable[key];
        }

        if (Object.keys(limitedVendors).length >= 20) {
          break;
        }
      }
    } else {
      limitedVendors = sortable;
    }

    try {
      // Last 6 months data
      let currentMonth = moment().format("MM");
      let currentYear = moment().format("YYYY");
      let lastSixMonthsMonth = moment().subtract(6, "months").format("MM");
      let lastSixMonthsYear = moment().subtract(6, "months").format("YYYY");

      const queryLastSixMonthsMonth = SearchReportProduct.query();
      let lastSixMonthStartDate = `${lastSixMonthsYear}-${lastSixMonthsMonth}-01`;
      let numberOfDaysLastSixMonthEnd = new Date(
        currentYear,
        currentMonth,
        0
      ).getDate();
      let lastSixMonthEndDate = `${currentYear}-${currentMonth}-${numberOfDaysLastSixMonthEnd}`;

      queryLastSixMonthsMonth.whereRaw(
        `search_report_products.created_at between '${lastSixMonthStartDate}' and '${lastSixMonthEndDate}'`
      );
      queryLastSixMonthsMonth.where("search_reports.module_id", moduleId);
      queryLastSixMonthsMonth.where("search_report_products.vendor", vendor);
      queryLastSixMonthsMonth.leftJoin(
        "search_reports",
        "search_reports.id",
        "search_report_products.search_report_id"
      );
      queryLastSixMonthsMonth.groupBy("name");

      let queryLastSixMonthsMonthResult = await queryLastSixMonthsMonth.fetch();
      let parsedLastSixMonthsMonthResult = queryLastSixMonthsMonthResult.toJSON();
      totalLastSixMonthsMonthCount = parsedLastSixMonthsMonthResult.length;

      // 6 Months Growth
      let secondLastSixMonthsStartMonth = moment()
        .subtract(12, "months")
        .format("MM");
      let secondLastSixMonthsStartYear = moment()
        .subtract(12, "months")
        .format("YYYY");
      let secondLastSixMonthsEndMonth = moment()
        .subtract(7, "months")
        .format("MM");
      let secondLastSixMonthsEndYear = moment()
        .subtract(7, "months")
        .format("YYYY");

      const querySecondLastSixMonthsMonth = SearchReportProduct.query();
      let secondLastSixMonthStartDate = `${secondLastSixMonthsStartYear}-${secondLastSixMonthsStartMonth}-01`;
      let numberOfDaysSecondLastSixMonthEnd = new Date(
        secondLastSixMonthsEndYear,
        secondLastSixMonthsEndMonth,
        0
      ).getDate();
      let secondLastSixMonthEndDate = `${secondLastSixMonthsEndYear}-${secondLastSixMonthsEndMonth}-${numberOfDaysSecondLastSixMonthEnd}`;

      querySecondLastSixMonthsMonth.whereRaw(
        `search_report_products.created_at between '${secondLastSixMonthStartDate}' and '${secondLastSixMonthEndDate}'`
      );
      querySecondLastSixMonthsMonth.where("search_reports.module_id", moduleId);
      querySecondLastSixMonthsMonth.where(
        "search_report_products.vendor",
        vendor
      );
      querySecondLastSixMonthsMonth.leftJoin(
        "search_reports",
        "search_reports.id",
        "search_report_products.search_report_id"
      );
      querySecondLastSixMonthsMonth.groupBy("name");

      let querySecondLastSixMonthsMonthResult = await querySecondLastSixMonthsMonth.fetch();
      let parsedSecondLastSixMonthsMonthResult = querySecondLastSixMonthsMonthResult.toJSON();
      totalSecondLastSixMonthsMonthCount =
        parsedSecondLastSixMonthsMonthResult.length;

      if (
        totalSecondLastSixMonthsMonthCount == 0 &&
        totalLastSixMonthsMonthCount == 0
      ) {
        lastSixMonthGrowth = 0;
      } else if (totalSecondLastSixMonthsMonthCount == 0) {
        lastSixMonthGrowth = 100;
      } else {
        lastSixMonthGrowth =
          ((totalLastSixMonthsMonthCount - totalSecondLastSixMonthsMonthCount) *
            100) /
          totalSecondLastSixMonthsMonthCount;
      }

      // Last 1 Year data
      let lastYearEndMonth = moment().format("MM");
      let lastYearEndYear = moment().format("YYYY");
      let lastYearStartMonth = moment().subtract(11, "months").format("MM");
      let lastYearStartYear = moment().subtract(11, "months").format("YYYY");

      const queryLastYear = SearchReportProduct.query();
      let lastYearStartDate = `${lastYearStartYear}-${lastYearStartMonth}-01`;
      let numberOfDaysLastYearMonthEnd = new Date(
        lastYearEndYear,
        lastYearEndMonth,
        0
      ).getDate();
      let lastYearEndDate = `${lastYearEndYear}-${lastYearEndMonth}-${numberOfDaysLastYearMonthEnd}`;

      queryLastYear.whereRaw(
        `search_report_products.created_at between '${lastYearStartDate}' and '${lastYearEndDate}'`
      );
      queryLastYear.where("search_reports.module_id", moduleId);
      queryLastYear.where("search_report_products.vendor", vendor);
      queryLastYear.leftJoin(
        "search_reports",
        "search_reports.id",
        "search_report_products.search_report_id"
      );
      queryLastYear.groupBy("name");

      let queryLastYearResult = await queryLastYear.fetch();
      let parsedLastYearResult = queryLastYearResult.toJSON();
      totalLastYearCount = parsedLastYearResult.length;

      // Last 1 Year Growth
      let secondLastYearEndMonth = moment().subtract(12, "months").format("MM");
      let secondLastYearEndYear = moment()
        .subtract(12, "months")
        .format("YYYY");
      let secondLastYearStartMonth = moment()
        .subtract(23, "months")
        .format("MM");
      let secondLastYearStartYear = moment()
        .subtract(23, "months")
        .format("YYYY");

      const querySecondLastYear = SearchReportProduct.query();
      let secondLastYearStartDate = `${secondLastYearStartYear}-${secondLastYearStartMonth}-01`;
      let numberOfDaysSecondLastYearMonthEnd = new Date(
        secondLastYearEndYear,
        secondLastYearEndMonth,
        0
      ).getDate();
      let secondLastYearEndDate = `${secondLastYearEndYear}-${secondLastYearEndMonth}-${numberOfDaysSecondLastYearMonthEnd}`;

      querySecondLastYear.whereRaw(
        `search_report_products.created_at between '${secondLastYearStartDate}' and '${secondLastYearEndDate}'`
      );
      querySecondLastYear.where("search_reports.module_id", moduleId);
      querySecondLastYear.where("search_report_products.vendor", vendor);
      querySecondLastYear.leftJoin(
        "search_reports",
        "search_reports.id",
        "search_report_products.search_report_id"
      );
      querySecondLastYear.groupBy("name");

      let querySecondLastYearResult = await querySecondLastYear.fetch();
      let parsedSecondLastYearResult = querySecondLastYearResult.toJSON();
      totalSecondLastYearCount = parsedSecondLastYearResult.length;

      if (totalSecondLastYearCount == 0 && totalLastYearCount == 0) {
        lastYearGrowth = 0;
      } else if (totalSecondLastYearCount == 0) {
        lastYearGrowth = 100;
      } else {
        lastYearGrowth =
          ((totalLastYearCount - totalSecondLastYearCount) * 100) /
          totalSecondLastYearCount;
      }

      // Last 2 Year Growth
      let thirdLastYearEndMonth = moment().subtract(24, "months").format("MM");
      let thirdLastYearEndYear = moment().subtract(24, "months").format("YYYY");
      let thirdLastYearStartMonth = moment()
        .subtract(35, "months")
        .format("MM");
      let thirdLastYearStartYear = moment()
        .subtract(35, "months")
        .format("YYYY");

      const queryThirdLastYear = SearchReportProduct.query();
      let thirdLastYearStartDate = `${thirdLastYearStartYear}-${thirdLastYearStartMonth}-01`;
      let numberOfDaysThirdLastYearMonthEnd = new Date(
        thirdLastYearEndYear,
        thirdLastYearEndMonth,
        0
      ).getDate();
      let thirdLastYearEndDate = `${thirdLastYearEndYear}-${thirdLastYearEndMonth}-${numberOfDaysThirdLastYearMonthEnd}`;

      queryThirdLastYear.whereRaw(
        `search_report_products.created_at between '${thirdLastYearStartDate}' and '${thirdLastYearEndDate}'`
      );
      queryThirdLastYear.where("search_reports.module_id", moduleId);
      queryThirdLastYear.where("search_report_products.vendor", vendor);
      queryThirdLastYear.leftJoin(
        "search_reports",
        "search_reports.id",
        "search_report_products.search_report_id"
      );
      queryThirdLastYear.groupBy("name");

      let queryThirdLastYearResult = await queryThirdLastYear.fetch();
      let parsedThirdLastYearResult = queryThirdLastYearResult.toJSON();
      totalThirdLastYearCount = parsedThirdLastYearResult.length;

      if (totalThirdLastYearCount == 0 && totalLastYearCount == 0) {
        lastTwoYearGrowth = 0;
      } else if (totalThirdLastYearCount == 0) {
        lastTwoYearGrowth = 100;
      } else {
        lastTwoYearGrowth =
          ((totalLastYearCount - totalThirdLastYearCount) * 100) /
          totalThirdLastYearCount;
      }

      // Last 3 Year Growth
      let fourthLastYearEndMonth = moment().subtract(36, "months").format("MM");
      let fourthLastYearEndYear = moment()
        .subtract(36, "months")
        .format("YYYY");
      let fourthLastYearStartMonth = moment()
        .subtract(47, "months")
        .format("MM");
      let fourthLastYearStartYear = moment()
        .subtract(47, "months")
        .format("YYYY");

      const queryFourthLastYear = SearchReportProduct.query();
      let fourthLastYearStartDate = `${fourthLastYearStartYear}-${fourthLastYearStartMonth}-01`;
      let numberOfDaysFourthLastYearMonthEnd = new Date(
        fourthLastYearEndYear,
        fourthLastYearEndMonth,
        0
      ).getDate();
      let fourthLastYearEndDate = `${fourthLastYearEndYear}-${fourthLastYearEndMonth}-${numberOfDaysFourthLastYearMonthEnd}`;

      queryFourthLastYear.whereRaw(
        `search_report_products.created_at between '${fourthLastYearStartDate}' and '${fourthLastYearEndDate}'`
      );
      queryFourthLastYear.where("search_reports.module_id", moduleId);
      queryFourthLastYear.where("search_report_products.vendor", vendor);
      queryFourthLastYear.leftJoin(
        "search_reports",
        "search_reports.id",
        "search_report_products.search_report_id"
      );
      queryFourthLastYear.groupBy("name");

      let queryFourthLastYearResult = await queryFourthLastYear.fetch();
      let parsedFourthLastYearResult = queryFourthLastYearResult.toJSON();
      totalFourthLastYearCount = parsedFourthLastYearResult.length;

      if (totalFourthLastYearCount == 0 && totalLastYearCount == 0) {
        lastThreeYearGrowth = 0;
      } else if (totalFourthLastYearCount == 0) {
        lastThreeYearGrowth = 100;
      } else {
        lastThreeYearGrowth =
          ((totalLastYearCount - totalFourthLastYearCount) * 100) /
          totalFourthLastYearCount;
      }
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
        error: error,
      });
    }

    let growthData = {
      sixMonth: Math.round(lastSixMonthGrowth),
      oneYear: Math.round(lastYearGrowth),
      TowYear: Math.round(lastTwoYearGrowth),
      ThreeYear: Math.round(lastThreeYearGrowth),
    };

    return response.status(200).send({
      message: "success",
      data: limitedVendors,
      growthData: growthData,
    });
  }
}

module.exports = VendorController;
