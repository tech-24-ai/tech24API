"use strict";
const Excel = require("exceljs");
const Database = use("Database");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const IndustryVendor = use("App/Models/Admin/VendorModule/IndustryVendor");
const ModuleVendor = use("App/Models/Admin/VendorModule/ModuleVendor");
const Industry = use("App/Models/Admin/ProductModule/Industry");
const Module = use("App/Models/Admin/ProductModule/Module");
const VendorCategory = use("App/Models/Admin/VendorModule/VendorCategory");
const Query = use("Query");
const moment = require("moment");
const _helperLogoScraper = require("../../../../Helper/logoScraper");
const _helperBasicInfoScraper = require("../../../../Helper/basicInfoScraper");
const Country = use("App/Models/Admin/LocationModule/Country");
const VendorEmployeeJobCounts = use(
  "App/Models/Admin/VendorModule/VendorEmployeeJobCounts"
);
const VendorLocations = use("App/Models/Admin/VendorModule/VendorLocations");
const _ = require("lodash");
const vendorLogoService = require("../../../../services/vendorlogo.service");

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
  "linkedin_url",
  "linkedin_salesurl",
  "image",
  "notes",
  "ticker",
  "twitter_handle",
  "main_country",
  "is_login",
  "expiry_date",
  "founded",
  "company_type",
  "company_size_on_linkedin",
];

class VendorController {
  async export({ response }) {
    const fileName = "vendors.xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Vendors");
    let worksheet1 = workbook.addWorksheet("Industries");
    let worksheet2 = workbook.addWorksheet("Modules");
    let worksheet3 = workbook.addWorksheet("Vendor Category");
    let font = { name: "Arial", size: 12 };

    const result = await Vendor.query()
      .with("industries")
      .with("modules")
      .with("vendor_category")
      .fetch();
    const data = await result.toJSON();

    let exportData = [];
    if (data) {
      data.forEach((element) => {
        const industries =
          element.industries && element.industries.map((value) => value.id);
        const modules =
          element.modules && element.modules.map((value) => value.id);
        // const vendor_categories =
        //   element.vendor_category &&
        //   element.vendor_category.map((value) => value.id);

        exportData.push({
          name: element.name,
          email: element.email,
          mobile: element.mobile,
          // categories: vendor_categories.join(","),
          categories: element.vendor_category_id,
          company: element.company,
          website: element.website,
          linkedin: element.linkedin_url,
          linkedinsales: element.linkedin_salesurl,
          ticker: element.ticker,
          logo: element.image,
          company_type: element.company_type,
          twitter_handle: element.twitter_handle,
          founded: element.founded,
          main_country: element.main_country,
          notes: element.notes,
          industries: industries.join(","),
          modules: modules.join(","),
        });
      });
    }

    let columns = [
      { header: "Name", key: "name", width: 20, style: { font: font } },
      { header: "Email", key: "email", width: 30, style: { font: font } },
      { header: "Mobile", key: "mobile", width: 10, style: { font: font } },
      {
        header: "Category",
        key: "categories",
        width: 20,
        style: { font: font },
      },
      {
        header: "Company as per Patent",
        key: "company",
        width: 40,
        style: { font: font },
      },
      { header: "Website", key: "website", width: 40, style: { font: font } },
      { header: "Ticker", key: "ticker", width: 10, style: { font: font } },
      {
        header: "LinkedIn URL",
        key: "linkedin",
        width: 40,
        style: { font: font },
      },
      {
        header: "LinkedIn Sales URL",
        key: "linkedinsales",
        width: 40,
        style: { font: font },
      },
      { header: "Company Logo", key: "logo", width: 40, style: { font: font } },
      {
        header: "Company Type",
        key: "company_type",
        width: 15,
        style: { font: font },
      },
      {
        header: "Twitter Handle",
        key: "twitter_handle",
        width: 15,
        style: { font: font },
      },
      { header: "Founded", key: "founded", width: 10, style: { font: font } },
      {
        header: "Headquater",
        key: "main_country",
        width: 20,
        style: { font: font },
      },
      { header: "Notes", key: "notes", width: 60, style: { font: font } },
      {
        header: "Industries",
        key: "industries",
        width: 30,
        style: { font: font },
      },
      { header: "Modules", key: "modules", width: 30, style: { font: font } },
    ];

    worksheet.columns = columns;
    worksheet.addRows(exportData);

    worksheet.getCell("B1", "C1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "cccccc" },
    };

    const industryResult = await Industry.query()
      .where("parent_id", null)
      .fetch();
    const industryData = await industryResult.toJSON();

    worksheet1.columns = [
      { header: "Id", key: "id", width: 10, style: { font: font } },
      { header: "Name", key: "name", width: 10, style: { font: font } },
    ];
    worksheet1.addRows(industryData);

    const moduleResult = await Module.query().fetch();
    const moduelData = await moduleResult.toJSON();

    worksheet2.columns = [
      { header: "Id", key: "id", width: 10, style: { font: font } },
      { header: "Name", key: "name", width: 10, style: { font: font } },
    ];
    worksheet2.addRows(moduelData);

    const vendorcategoryResult = await VendorCategory.query().fetch();
    const vendorcategoryData = await vendorcategoryResult.toJSON();

    worksheet3.columns = [
      { header: "Id", key: "id", width: 10, style: { font: font } },
      { header: "Name", key: "name", width: 10, style: { font: font } },
    ];
    worksheet3.addRows(vendorcategoryData);

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }

  async import({ request, response }) {
    await Database.raw("SET FOREIGN_KEY_CHECKS = 0;");

    const validationOptions = {
      types: [
        "xls",
        "xlsx",
        "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    };
    let dataArray = [];

    request.multipart.file("file", validationOptions, async (file) => {
      // set file size from stream byteCount, so adonis can validate file size
      file.size = file.stream.byteCount;

      // run validation rules
      await file.runValidations();

      // catches validation errors, if any and then throw exception
      const error = file.error();
      if (error.message) {
        throw new Error(error.message);
      }

      var workbook = new Excel.Workbook();

      workbook = await workbook.xlsx.read(file.stream);

      var worksheet = workbook.getWorksheet(1);
      let rowData;

      worksheet.eachRow(
        { includeEmpty: true },
        async function (row, rowNumber) {
          rowData = JSON.parse(JSON.stringify(row.values));

          if (rowData && rowData.length > 0 && rowNumber !== 1) {
            const categories = rowData[4] ? rowData[4].split(",") : [];
            const industries = rowData[16] ? rowData[16].split(",") : [];
            const modules = rowData[17] ? rowData[17].split(",") : [];
            let name;
            let company;
            let email;
            let website;
            let logourl;
            let linkedinurl;
            let linkedinsalesurl;

            if (rowData[1]) {
              if (typeof rowData[1] === "string") {
                name = rowData[1];
              } else {
                name = rowData[1].text;
              }
            }
            if (rowData[5]) {
              if (typeof rowData[5] === "string") {
                company = rowData[5];
              } else {
                company = rowData[5].text;
              }
            }
            if (rowData[2]) {
              if (typeof rowData[2] === "string") {
                email = rowData[2];
              } else {
                email = rowData[2].text;
              }
            }

            if (rowData[6]) {
              if (typeof rowData[6] === "string") {
                website = rowData[6];
              } else {
                website = rowData[6].text;
              }
            }

            if (rowData[10]) {
              if (typeof rowData[10] === "string") {
                logourl = rowData[10];
              } else {
                logourl = rowData[10].text;
              }
            }

            if (rowData[8]) {
              if (typeof rowData[8] === "string") {
                linkedinurl = rowData[8];
              } else {
                linkedinurl = rowData[8].text;
              }
            }

            if (rowData[9]) {
              if (typeof rowData[9] === "string") {
                linkedinsalesurl = rowData[9];
              } else {
                linkedinsalesurl = rowData[9].text;
              }
            }

            const bodyData = {
              name: name,
              email: email,
              mobile: rowData[3] ? rowData[3] : "",
              ticker: rowData[7] ? rowData[7] : "",
              company: company,
              website: website,
              linkedin_url: linkedinurl,
              linkedin_salesurl: linkedinsalesurl,
              image: logourl,
              twitter_handle: rowData[12] ? rowData[12] : "",
              company_type: rowData[11] ? rowData[11] : "",
              founded: rowData[13] ? rowData[13] : "",
              // headquarter: rowData[14] ? rowData[14] : "",
              main_country: rowData[14] ? rowData[14] : "",
              notes: rowData[15] ? rowData[15] : "",
            };
            dataArray.push(bodyData);
            if (name) {
              const vendorQuery = await Vendor.findBy("name", name);
              if (vendorQuery) {
                vendorQuery.merge(bodyData);
                await vendorQuery.save();
                if (industries && industries.length) {
                  await vendorQuery.industries().detach();
                  await vendorQuery.industries().attach(industries);
                }
                if (modules && modules.length) {
                  await vendorQuery.modules().detach();
                  await vendorQuery.modules().attach(modules);
                }
                if (categories && categories.length) {
                  await vendorQuery.vendor_category().detach();
                  await vendorQuery.vendor_category().attach(categories);
                }
              } else {
                const query = await Vendor.create(bodyData);
                if (industries && industries.length) {
                  await query.industries().detach();
                  await query.industries().attach(industries);
                }
                if (modules && modules.length) {
                  await query.modules().detach();
                  await query.modules().attach(modules);
                }
                if (categories && categories.length) {
                  await query.vendor_category().detach();
                  await query.vendor_category().attach(categories);
                }
              }
            }
          }
        }
      );
    });

    await request.multipart.process();

    await Database.raw("SET FOREIGN_KEY_CHECKS = 1;");
    return response
      .status(200)
      .send({ message: "Create successfully", dataArray });
  }

  async index({ request, response }) {
    const query = Vendor.query();
    query.with("vendor_category");
    const search = request.input("search");
    const orderBy = request.input("orderBy");
    const orderDirection = request.input("orderDirection");
    const vendor_Category = request.input("vendor_Category");
    const searchQuery = new Query(request, { order: "id" });

    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    if (search) {
      query.where(searchQuery.search(searchInFields));
    }

    var vendorcategoryname = "";
    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "vendor_category.name":
            vendorcategoryname = filter.value;
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
            query.whereRaw(`${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    if (vendor_Category) query.where("vendor_category_id", vendor_Category);

    if (vendorcategoryname.length > 0) {
      const categoryids = await VendorCategory.query()
        .whereRaw(`name LIKE '%${vendorcategoryname}%'`)
        .pluck("id");
      if (categoryids.length > 0)
        query.whereRaw("vendor_category_id in (?)", [categoryids]);
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

  async store({ request, response }) {
    var body = request.only(requestOnly);
    const query = await Vendor.create(body);
    query.vendor_category_id = request.input("vendor_category_id");
    await query.industries().detach();
    await query.industries().attach(JSON.parse(request.input("industries")));
    await query.modules().detach();
    await query.modules().attach(JSON.parse(request.input("modules")));
    await query.save();
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, response }) {
    const query = Vendor.query();
    query.where("id", params.id);
    query.with("vendor_category");
    const result = await query.firstOrFail();
    const industriesIds = await result.industries().ids();
    result.industries = industriesIds;
    const modulesIds = await result.modules().ids();
    result.modules = modulesIds;
    return response.status(200).send(result);
  }

  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const query = await Vendor.findOrFail(params.id);
    query.vendor_category_id = request.input("vendor_category_id");
    query.merge(body);
    await query.save();
    await query.industries().detach();
    await query.industries().attach(JSON.parse(request.input("industries")));
    await query.modules().detach();
    await query.modules().attach(JSON.parse(request.input("modules")));
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    const query = await Vendor.findOrFail(params.id);
    try {
      await query.delete();
      return response.status(200).send({ message: "Delete successfully" });
    } catch (error) {
      return response.status(423).send({
        message: "Something went wrong",
      });
    }
  }

  async bulkDestroy({ request, response }) {
    const ids = JSON.parse(request.input("ids"));
    const result = await Vendor.query().delete().whereIn("id", ids);
    // await Database.raw('SET FOREIGN_KEY_CHECKS = 0;')
    // await Vendor.truncate()
    // await Database.raw('SET FOREIGN_KEY_CHECKS = 1;')

    let message;
    if (result) {
      message = "Delete successfully";
    } else {
      message = "Delete failed";
    }
    return response.status(200).send({ message: message });
  }

  async changePassword({ params, request, response }) {
    let query = await Vendor.findOrFail(params.id);
    query.password = request.input("password");
    await query.save();
    return response
      .status(200)
      .send({ message: "Password update successfully" });
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
    query.where("id", params.id);
    query.with("industries");
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
        name: "Industry",
        value: industries,
      },
      {
        name: "Specialities",
        value: result.company_type,
      },
      {
        name: "Headquarters",
        value: result.main_country,
      },
    ];

    return response.status(200).send(result);
  }

  async fetch_logo({ request, auth, response, params }) {
    const url = request.input("url");
    try {
      let result = await _helperLogoScraper.logoScraper([url], auth, params.id);
      return response.status(200).send(result[0]);
    } catch (ex) {
      return response.status(423).send({
        message: `${url} - Invalid website address`,
      });
    }
  }

  async fetch_info({ request, auth, response, params }) {
    try {
      const linkedin_url = request.input("linkedin_url");
      const linkedin_salesurl = request.input("linkedin_salesurl");
      let message = "Data Fetched successfully";
      //  fetch Vendor info from Linkedin Profile
      //let result = await _helperBasicInfoScraper.fetchVendorInfo();
      let result = await _helperBasicInfoScraper.updateVendorBasicInfo(
        params.id,
        linkedin_url
      );

      // fetch Vendor info from Linkedin Profile
      //let keypeopleresult = await _helperBasicInfoScraper.updateVendorKeyPeople(
      //params.id,
      //linkedin_salesurl
      //);

      //if(keypeopleresult != "Data updated successfully"){
      //message = keypeopleresult
      //}

      return response.status(200).send({ message: message, result: result });
    } catch (ex) {
      return response.status(423).send({
        message: `Error fetching Data : ${ex}`,
      });
    }
  }

  async fetch_ritekit_logo({ request, auth, response, params }) {
    const company_url = request.input("url");
    try {
      let url = await _helperLogoScraper.fetchRiteKiteLogo(
        company_url,
        auth,
        params.id
      );
      return response.status(200).send({ url });
    } catch (ex) {
      return response.status(422).send([
        {
          message: `${ex.message}`,
        },
      ]);
    }
  }

  async fetch_ritekit_logo_bulk({ request, auth, response, params }) {
    try {

      const data = await vendorLogoService.getVendorLogos()
      
      return response.status(200).send({  });
    } catch (ex) {
      return response.status(422).send([
        {
          message: `${ex.message}`,
        },
      ]);
    }
  }

  async vendor_info({ request, response, params }) {
    try {
      //let result = await _helperBasicInfoScraper.fetchlogoFromNubelaLogs();
      let result = await _helperBasicInfoScraper.getVendorLogosFromLinkedInUrl();

      return response
        .status(200)
        .send({ message: "All vendors List", result: result });
    } catch (error) {
      return response.status(423).send({
        message: `Error fetching Data : ${error}`,
      });
    }
  }

  async vendor_linkedinurl({ request, response, params }) {
    try {
      let result = await _helperBasicInfoScraper.updateVendorLinkedinUrl();

      return response
        .status(200)
        .send({ message: "Linkedin Url updated successfully", result: result });
    } catch (error) {
      return response.status(423).send({
        message: `Error fetching Data : ${ex}`,
      });
    }
  }

  
  async getVendorLinkedList({ response }) {
    const query = Vendor.query();
    query.select("name");
    query.select("id");
    query.select("linkedin_url ");
    query.whereNull("logo_linkedin_url");
    query.limit(100);
    
    let data = await query.fetch();
    return response.status(200).send(data);
  }

  async updateVendorLinkedIn({ params, request, response }) {
    const vendorId = request.input("vendorId");
    const logolinkedInUrl = request.input("logolinkedInUrl");
  console.log(vendorId);
    const updateQuery = await Vendor.findOrFail(vendorId);
    updateQuery.logo_linkedin_url = logolinkedInUrl;

    var result = await updateQuery.save();

    return response
      .status(200)
      .send(result);


  }
}

module.exports = VendorController;
