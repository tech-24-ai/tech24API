const SearchReport = use("App/Models/Report/SearchReport");
const Visitors = use("App/Models/Admin/VisitorModule/Visitor");
const moment = require("moment");
const Query = use("Query");
const { getUserSubscribtions } = require("../../../../Helper/userSubscription");
const searchInFields = [
  "id",
  "name",
  "email",
  "mobile",
  "company",
  "designation",
];

class LeadGenerationController {

  async index({ request, response, auth }) {
    const query = SearchReport.query();
    let startDate = request.input("startDate");
    let endDate = request.input("endDate");
    let countries = request.input("countries");
    let org_size = request.input("org_size");
    let industires = request.input("industries");
    let modules = request.input("modules");
    const search = request.input("search");

    const visitorsQuery = Visitors.query();
    const searchQuery = new Query(request, { order: "id" });

    // query.distinct("search_reports.visitor_id");
    // query.leftJoin("visitors", "visitors.id", "search_reports.visitor_id");
    const user = await auth.authenticator("investorAuth").getUser();
    const { allowedModules, allowedCountries } = await getUserSubscribtions(
      user.id,
      3
    );
    //query.whereIn("search_reports.country_id", allowedCountries);

    visitorsQuery.select("visitors.id");
    visitorsQuery.select("visitors.name");
    visitorsQuery.select("visitors.email");
    visitorsQuery.select("visitors.designation");
    visitorsQuery.select("visitors.company");
    visitorsQuery.select("visitors.connections");
    visitorsQuery.select("visitors.linkedin_link");
    visitorsQuery.select("visitors.company_logo");
    visitorsQuery.select("visitors.company_size");
    visitorsQuery.select("visitors.company_linkedin_link");
    visitorsQuery.select("visitors.location");
    visitorsQuery.select("visitors.country_id");
    visitorsQuery.select("visitors.country_full_name");
    visitorsQuery.select("visitors.evaluation_stage");
    // query.select("search_reports.*")
    if (startDate) {
      startDate = moment(startDate).toISOString();
    } else {
      startDate = moment().startOf("year").toISOString();
    }

    if (endDate) {
      endDate = moment(endDate).toISOString();
    } else {
      endDate = moment().endOf("year").toISOString();
    }

    //if (countries)
      //query.whereIn("search_reports.country_id", JSON.parse(countries));

    if (industires)
      query.whereIn("search_reports.industry_id", JSON.parse(industires));

    if (modules) query.whereIn("search_reports.module_id", JSON.parse(modules));
    query.whereIn("search_reports.module_id", allowedModules);
    query.where("search_reports.created_at", ">=", startDate);
    query.where("search_reports.created_at", "<=", endDate);
    query.leftJoin("categories", "categories.id", "search_reports.category_id");
    let visitor_ids = await query.pluck("visitor_id");
    visitorsQuery.whereIn("id", visitor_ids);
    visitorsQuery.whereNotNull("linkedin_link");
    
    if(countries)
      visitorsQuery.whereIn("country_id", JSON.parse(countries));

    if (org_size) visitorsQuery.whereIn("company_size", JSON.parse(org_size));

    let page = null;
    let pageSize = null;

    if (search) {
      visitorsQuery.where(searchQuery.search(searchInFields));
    }

    if (request.input("page")) {
      page = request.input("page");
    }
    if (request.input("pageSize")) {
      pageSize = request.input("pageSize");
    }

    var result;
    if (page && pageSize) {
      result = await visitorsQuery.paginate(page, pageSize);
    } else {
      result = await visitorsQuery.fetch();
    }

    return response.status(200).send(result);
  }

  async search({ request, response }) {   
    let result = [];

    const query = Visitors.query();

    const searchQuery = new Query(request, { order: "id" });
    query.where(searchQuery.search(["name"]));

    if (request.input("id")) {
      let ids = JSON.parse(request.input("id"))
      //console.log(ids)
      if (request.input("id") && request.input("id") != "0") {
        query.whereIn("id", ids);
      }
    }
    result = await query.fetch();
    return response.status(200).send(result);
  }
}

module.exports = LeadGenerationController;
