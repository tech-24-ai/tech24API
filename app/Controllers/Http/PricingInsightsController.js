'use strict'
const Database = use("Database");
const PricingConfiguration = use("App/Models/PricingConfiguration");
const PricingCongfigurationRegionMapping = use("App/Models/PricingCongfigurationRegionMapping");
const PricingConfigurationPriceMapping = use("App/Models/PricingConfigurationPriceMapping");
const Query = use("Query");
const moment = require("moment");
const _ = require("lodash");
const Country = use("App/Models/Admin/LocationModule/Country");
const CountryGroup = use("App/Models/Admin/LocationModule/CountryGroup");
const Excel = require('exceljs')
const Module = use("App/Models/Admin/ProductModule/Module");
const PricingModel = use("App/Models/PricingModel");

const searchInFields = [
  "id",
  "name",
  "notes",
  "unit"
];

const requestOnly = [
  "name",
  "category_id",
  "module_id",
  "unit",
  "pricing_model_id",
  "notes"
];

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with pricingconfigurations
 */
class PricingInsightsController {
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
    // let countries = request.input("countries");
    let modules = request.input("modules");
    let regions = request.input("regions");

    let startYear = request.input("start_year");
    let endYear = request.input("end_year");

    query.select('pricing_configurations.id');
    query.select('pricing_configurations.name');
    query.select('pricing_configurations.unit');
    query.select('pricing_configurations.graph_y_label');
    query.select('pricing_configurations.notes');
    query.select('pricing_configuration_price_mappings.avgprice as AvgPrice');
    query.select('pricing_configuration_price_mappings.currency');
    query.select('country_groups.name as region');
    query.select('pricing_models.name as PricingModelName');
    query.select('categories.name as CategoryName');
    query.select('modules.name as ModuleName');
    query.select('modules.notes as module_notes');

    query.select('pricing_congfiguration_region_mappings.deal_size');

    query.leftJoin('pricing_models', 'pricing_models.id', 'pricing_configurations.pricing_model_id')
    query.leftJoin('categories', 'categories.id', 'pricing_configurations.category_id')
    query.leftJoin('modules', 'modules.id', 'pricing_configurations.module_id')
    query.leftJoin('pricing_congfiguration_region_mappings', 'pricing_congfiguration_region_mappings.pricing_config_id', 'pricing_configurations.id')
    query.leftJoin('country_groups', 'country_groups.id', 'pricing_congfiguration_region_mappings.country_groups_id')
    query.leftJoin('pricing_configuration_price_mappings', 'pricing_configuration_price_mappings.region_mapping_id', 'pricing_congfiguration_region_mappings.id')
    // query.where("pricing_congfiguration_region_mappings.has_all_country",true)

    //query.groupBy("pricing_configurations.id");
    //query.groupBy("pricing_configurations.name");
    //query.groupBy("pricing_configurations.unit");
    //query.groupBy("pricing_configurations.notes");
    //query.groupBy("pricing_configuration_price_mappings.currency");
    //query.groupBy("pricing_models.name");
    //uery.groupBy("categories.name");
    //query.groupBy("modules.name");

    if (regions) {
      // const regions = JSON.parse(request.input("regions"));
      // const countryQuery = Country.query();
      // countryQuery.whereIn("group_id", regions);
      // let countryIds = await countryQuery.pluck("id");

      let parsedRegions = JSON.parse(regions);
      query.whereIn("pricing_congfiguration_region_mappings.country_groups_id", parsedRegions);
    }

    // if (countries) {
    //   query.whereIn("pricing_congfiguration_region_mappings.country_groups_id", JSON.parse(countries));
    // }

    if (modules) {
      query.whereIn("pricing_configurations.module_id", JSON.parse(modules));
    }

    // if (request.input("regions")) { 
    //   const regions = JSON.parse(request.input("regions"));
    //   const countryQuery = Country.query();
    //   countryQuery.whereIn("group_id", regions);
    //   let countryIds = await countryQuery.pluck("id");
    //   query.whereIn("pricing_configuration_price_mappings.region_mapping_id", countryIds);
    // }

    // if(startYear && endYear) {
    //   query.whereRaw(
    //     `pricing_congfiguration_region_mappings.year >= ${startYear}`
    //   );
    //   query.whereRaw(
    //     `pricing_congfiguration_region_mappings.year <= ${endYear}`
    //   );
    // }

    let year = moment().year();
    if (year) {
      query.whereRaw(`pricing_congfiguration_region_mappings.year = ${year}`);
    }


    if (orderBy && orderDirection) {
      query.orderBy(`${orderBy}`, orderDirection);
    }

    // if (search) {
    //   query.where(searchQuery.search(searchInFields));
    // }

    // if (request.input("filters")) {
    //   const filters = JSON.parse(request.input("filters"));
    //   filters.forEach((filter) => {
    //     switch (filter.name) {
    //       case "created_at":
    //         query.whereRaw(
    //           `DATE(${filter.name}) = '${moment(filter.value).format(
    //             "YYYY-MM-DD"
    //           )}'`
    //         );
    //         break;
    //       case "updated_at":
    //         query.whereRaw(
    //           `DATE(${filter.name}) = '${moment(filter.value).format(
    //             "YYYY-MM-DD"
    //           )}'`
    //         );
    //         break;
    //       default:
    //         let queryStr = "";
    //         if (Array.isArray(filter.value)) {
    //           filter.value.forEach((x) => {
    //             if (queryStr != "") queryStr += " or ";
    //             queryStr += `${filter.name} LIKE '%${x}%'`;
    //           });
    //         } else {
    //           queryStr = `${filter.name} LIKE '%${filter.value}%'`;
    //         }
    //         query.whereRaw(queryStr);
    //         break;
    //     }
    //   });
    // }

    // if (request.input("start_date") && request.input("end_date")) {
    //   query.whereRaw(`DATE(created_at) >= '${request.input("start_date")}'`);
    //   query.whereRaw(`DATE(created_at) <= '${request.input("end_date")}'`);
    // }

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

   
    let rowResult = result.toJSON();
    const unique = [...new Set(rowResult.data.map(result => result.id))];
    const colorList = ["#ffd6d6", "#fff1d6", "#f6ffd6", '#dbffd6', "#d6fff9","#d6eeff", "#d6dbff"];
    const colorMap = {};

    unique.forEach((id, index) => {
      if(index > colorList.length){
        index = index - colorList.length - 1
      }
      colorMap[id] = colorList[index];
    })

    for (let d of rowResult.data) {
      d['color'] = colorMap[d.id]
    }

    return response.status(200).send(rowResult);
  }


  async graphIndex({ request, response, view }) {
    const query = PricingConfiguration.query();
    var result;

    query.select('pricing_configurations.id');
    query.select('pricing_configurations.name');
    query.select('pricing_configurations.notes');
    query.select('pricing_configurations.graph_y_label');
    query.select('pricing_configuration_price_mappings.avgprice as AvgPrice');
    query.select('pricing_congfiguration_region_mappings.year');
    query.where('module_id', request.input('module_id'));
    query.where("pricing_congfiguration_region_mappings.has_all_country",true)
    let endYear = moment().year();
    let startYear = endYear - 4;


    if (startYear && endYear) {
      query.whereRaw(
        `pricing_congfiguration_region_mappings.year >= ${startYear}`
      );
      query.whereRaw(
        `pricing_congfiguration_region_mappings.year <= ${endYear}`
      );
    }

    query.leftJoin('pricing_congfiguration_region_mappings', 'pricing_congfiguration_region_mappings.pricing_config_id', 'pricing_configurations.id')
    query.leftJoin('pricing_configuration_price_mappings', 'pricing_configuration_price_mappings.region_mapping_id', 'pricing_congfiguration_region_mappings.id')

    query.groupBy("pricing_configurations.id");
    query.groupBy("pricing_configurations.name");
    query.groupBy("pricing_congfiguration_region_mappings.year");

    query.orderBy('pricing_configurations.id')
    query.orderBy('year')

    result = await query.fetch();

    let parsedResult = result.toJSON();
    let allYears = [];

    for (let pRes of parsedResult) {
      pRes['x'] = +pRes['year']
      pRes['y'] = +pRes['AvgPrice']

      if (!allYears.includes(+pRes['year'])) {
        allYears.push(+pRes['year']);
      }
    }

    allYears = allYears.sort();

    let groupedData = _.chain(parsedResult)
      .groupBy("name")
      .map((value, key) => ({ name: key, data: value }))
      .value()


    for (let gdata of groupedData) {
      gdata = _.orderBy(gdata, ['x'], ['asc']);
    }


    return response.status(200).send({ allYears: allYears, line: groupedData });
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
  async create({ request, response, view }) {
  }

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
      query.pricing_model_id = request.input("pricing_model_id");
      query.notes = request.input("notes");

      await query.save(trx);

      let configs = request.input("configs");
      let configurationId = query.id;

      if (configs) {
        for (let conf of configs) {
          const queryPCRM = new PricingCongfigurationRegionMapping()

          queryPCRM.pricing_config_id = configurationId;
          queryPCRM.country_groups_id = conf.country_groups_id;
          queryPCRM.year = conf.year;
          await queryPCRM.save(trx)

          let PCRMId = queryPCRM.id;

          for (let price of conf.prices) {
            const queryPCPM = new PricingConfigurationPriceMapping()

            queryPCPM.region_mapping_id = PCRMId;
            queryPCPM.avgprice = price.avgprice;
            queryPCPM.currencies_id = price.currencies_id;
            await queryPCPM.save(trx)
          }
        }
      } else {
        trx.rollback();
      }

      trx.commit();
      return response.status(200).send({ message: "Create successfully" });
    } catch (error) {
      trx.rollback();
      return response.status(423).send({ message: 'Something went wrong' })
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
    let AllConfigs = await PricingCongfigurationRegionMapping.query().with("countryGroups")
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
  async edit({ params, request, response, view }) {
  }

  /**
   * Update pricingconfiguration details.
   * PUT or PATCH pricingconfigurations/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    const query = await PricingConfiguration.findOrFail(params.id)
    const trx = await Database.beginTransaction();

    query.name = request.input("name");
    query.category_id = request.input("category_id");
    query.module_id = request.input("module_id");
    query.unit = request.input("unit");
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

        const queryPCRM = await PricingCongfigurationRegionMapping.findOrFail(configId)
        await queryPCRM.delete(trx);
      }

      let configs = request.input("configs");
      if (configs) {
        for (let conf of configs) {
          const queryPCRM = new PricingCongfigurationRegionMapping()

          queryPCRM.pricing_config_id = params.id;
          queryPCRM.country_groups_id = conf.country_groups_id;
          queryPCRM.year = conf.year;
          await queryPCRM.save(trx)

          let PCRMId = queryPCRM.id;

          for (let price of conf.prices) {
            const queryPCPM = new PricingConfigurationPriceMapping()

            queryPCPM.region_mapping_id = PCRMId;
            queryPCPM.avgprice = price.avgprice;
            queryPCPM.currencies_id = price.currencies_id;
            await queryPCPM.save(trx)
          }
        }
      } else {
        trx.rollback();
      }
      await query.save(trx);
      trx.commit();
      return response.status(200).send({ message: 'Update successfully' })
    } catch (error) {
      trx.rollback();
      return response.status(423).send({ message: 'Something went wrong' })
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
    const query = await PricingConfiguration.findOrFail(params.id)
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

        const queryPCRM = await PricingCongfigurationRegionMapping.findOrFail(configId)
        await queryPCRM.delete(trx);
      }

      await query.delete(trx)
      trx.commit();

      return response.status(200).send({ message: 'Delete successfully' })
    } catch (error) {
      trx.rollback();
      return response.status(423).send({ message: 'Something went wrong' })
    }
  }



  async export({ request, response }) {

    const fileName = 'pricingConfig.xlsx'
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Sheet 1");
    let font = { name: 'Arial', size: 12 };
    let module_id = -1;
    if(request.input("module_id"))
      module_id = request.input("module_id")

    let columns = [
        { header: "Market", key: "market", width: 10, style: { font: font } },
        { header: "Configuration", key: "configuration", width: 10, style: { font: font } },
        { header: "Description", key: "description", width: 10, style: { font: font } },
        { header: "Selling Price", key: "sellingPrice", width: 10, style: { font: font } },
        { header: "Unit", key: "unit", width: 10, style: { font: font } },
        // { header: "Model", key: "model", width: 10, style: { font: font } },
        { header: "Deal Size", key: "dealSize", width: 10, style: { font: font } },
        // { header: "Region", key: "region", width: 10, style: { font: font } },
        { header: "Year", key: "year", width: 10, style: { font: font } },
        { header: "Graph Label (y Axis)", key: "graphLabelYAxis", width: 10, style: { font: font } }
    ];

    // Adding Header List for Countries
    const CountryGroupQuery = CountryGroup.query()
    const countryGroups = await CountryGroupQuery.fetch()
    const countryGroupsData = countryGroups.toJSON()
    let countryGroupsHeader = ''
    if (countryGroupsData) {
        countryGroupsData.forEach(countryGroupElement => {
            countryGroupsHeader += `${countryGroupElement.id}. ${countryGroupElement.name}\n`
        });

        countryGroupsHeader += 'All: 0'
        columns.push(
            { header: countryGroupsHeader, key: 'region', width: 10, style: { font: font } }
        )
    }


    // Adding Header List for Pricing Model
    const PricingModelQuery = PricingModel.query()
    const pricingModels = await PricingModelQuery.fetch()
    const pricingModelsData = pricingModels.toJSON()
    let pricingModelsHeader = ''
    if (pricingModelsData) {
        pricingModelsData.forEach(pricingModelElement => {
          pricingModelsHeader += `${pricingModelElement.id}. ${pricingModelElement.name}\n`
        });

        columns.push(
            { header: pricingModelsHeader, key: 'model', width: 10, style: { font: font } }
        )
    }


    let result = []
    worksheet.columns = columns
    let rowArray = []

    const query = PricingConfiguration.query();

    query.select('pricing_configurations.id');
    query.select('pricing_configurations.name');
    query.select('pricing_configurations.unit');
    query.select('pricing_configurations.graph_y_label');
    query.select('pricing_configurations.notes');
    query.select('pricing_configuration_price_mappings.avgprice as AvgPrice');
    query.select('pricing_configuration_price_mappings.currency');
    query.select('country_groups.name as region');
    query.select('country_groups.id as regionId');
    query.select('pricing_models.name as PricingModelName');
    query.select('pricing_models.id as PricingModelId');
    query.select('categories.name as CategoryName');
    query.select('modules.name as ModuleName');

    query.select('pricing_congfiguration_region_mappings.deal_size');
    query.select('pricing_congfiguration_region_mappings.year');

    query.leftJoin('pricing_models', 'pricing_models.id', 'pricing_configurations.pricing_model_id')
    query.leftJoin('categories', 'categories.id', 'pricing_configurations.category_id')
    query.leftJoin('modules', 'modules.id', 'pricing_configurations.module_id')
    query.leftJoin('pricing_congfiguration_region_mappings', 'pricing_congfiguration_region_mappings.pricing_config_id', 'pricing_configurations.id')
    query.leftJoin('country_groups', 'country_groups.id', 'pricing_congfiguration_region_mappings.country_groups_id')
    query.leftJoin('pricing_configuration_price_mappings', 'pricing_configuration_price_mappings.region_mapping_id', 'pricing_congfiguration_region_mappings.id')
    if(module_id != -1)
      query.where("pricing_configurations.module_id",module_id  )

    var queryResult = await query.fetch();
    result = queryResult.toJSON();


    result.forEach(element => {

        let regionid = "0";

        if(element.regionId && element.regionId.length>0){
          regionid = element.regionId;
        }

        rowArray = {
          market: element.ModuleName,
          configuration: element.name,
          description: element.notes,
          sellingPrice: element.AvgPrice,
          unit: element.unit,
          model: element.PricingModelId,
          dealSize: element.deal_size,
          region: regionid,
          year: element.year,
          graphLabelYAxis: element.graph_y_label
        }

        worksheet.addRow(rowArray)
    });

    worksheet.getCell('B1', 'C1').fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: 'cccccc' }
    }

    response.header(`Content-Type`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`)
    return workbook.xlsx.writeBuffer(response)
}


  async import({ request, response }) {

    const validationOptions = {
      types: ['xls', 'xlsx', 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    }

    request.multipart.file('file', validationOptions, async (file) => {

      // set file size from stream byteCount, so adonis can validate file size
      file.size = file.stream.byteCount

      // run validation rules
      await file.runValidations()

      // catches validation errors, if any and then throw exception
      const error = file.error()
      if (error.message) {
        throw new Error(error.message)
      }

      var workbook = new Excel.Workbook()
      workbook = await workbook.xlsx.read(file.stream)

      var worksheet = workbook.getWorksheet(1);
      let rowData

      // fetch all modules
      const allModuleQuery = await Module.query().fetch()
      let allModules = allModuleQuery.toJSON();

      // fetch all Regions
      const allCountryGroupQuery = await CountryGroup.query().fetch()
      let allCountryGroups = allCountryGroupQuery.toJSON();

      // fetch all Models
      const allPricingModelQuery = await PricingModel.query().fetch()
      let allPricingModel = allPricingModelQuery.toJSON();


      let excellModule = []
      let excellRegion = []
      let excellModel = []

      let invalidExcellModule = []
      let invalidExcellRegion = []
      let invalidExcellModel = []

      worksheet.eachRow({ includeEmpty: true }, async function (row, rowNumber) { 
       let rowData = JSON.parse(JSON.stringify(row.values))

       if (rowNumber !== 1 && rowData.length) { 
        excellModule.push(rowData[1]);
        excellRegion.push(rowData[9]);
        excellModel.push(rowData[10]);
       }
      });
      
      // find empty and invalid Market
      let isInvalidModule = false;
      for(let module of excellModule) {
        if(!module) {
          isInvalidModule = true;
          break;
        } else {
          let moduleResult = _.find(allModules, { name: module});
          if(!moduleResult) {
            invalidExcellModule.push(module);
          }
        }
      }

      if(isInvalidModule) {
        return response.status(423).send({ message: "Market is required"});
      } else if(invalidExcellModule.length){
        return response.status(423).send({ message: "Invalid Market", market: invalidExcellModule});
      }


      // find empty and invalid Region
      let isInvalidRegion = false;
      for(let region of excellRegion) {
        if(!region && region != 0) {
          isInvalidRegion = true;
          break;
        } else {
          if(region == 99999) { 

          } else {
            if(region == 0){

            }else{
              let regionResult = _.find(allCountryGroups, { id: region});
              if(!regionResult) {
                invalidExcellRegion.push(region);
              }
            }
          }
        }
      }

      if(isInvalidRegion) {
        return response.status(423).send({ message: "Region is required"});
      } else if(invalidExcellRegion.length) {
        return response.status(423).send({ message: "Invalid Region", regions: invalidExcellRegion});
      }


      // find empty and invalid Pricing Models
      let isInvalidexcellModel = false;
      for(let model of excellModel) {
        if(!module) {
          isInvalidexcellModel = true;
          break;
        } else {
          let modelResult = _.find(allPricingModel, { id: model});
          if(!modelResult) {
            invalidExcellModel.push(model);
          }
        }
      }

      if(isInvalidexcellModel) {
        return response.status(423).send({ message: "Model is required"});
      } else if(invalidExcellModel.length) {
        return response.status(423).send({ message: "Invalid Model", models: invalidExcellModel});
      }

      var arrData = [];
      
      try {
        worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
          rowData = JSON.parse(JSON.stringify(row.values))
  
          if (rowNumber !== 1 && rowData.length) {
            let objData = {
              moduleName : rowData[1] ? rowData[1] : null,
              name : rowData[2] ? rowData[2] : null,
              notes : rowData[3] ? rowData[3] : null,
              avgprice : rowData[4] ?  rowData[4] : null,
              unit : rowData[5] ? rowData[5] : null,
              graph_y_label : rowData[8] ? rowData[8] : null,
              country_groups_id : rowData[9] ? rowData[9] : null,
              pricing_model_id : rowData[10] ? rowData[10] : null,
              year : rowData[7] ?  rowData[7] : null,
              deal_size : rowData[6] ?  rowData[6] : null
            }
            arrData.push(objData);
          }
        });
      }
      catch(error){

      }
      
      console.log(arrData);

      for(var i = 0; i < arrData.length;i++){
        let data = arrData[i];
        const priceConfigQuery = new PricingConfiguration();
        console.log(data);
        try {
          priceConfigQuery.name = data.name;
          priceConfigQuery.notes = data.notes;
          priceConfigQuery.unit = data.unit;
          priceConfigQuery.graph_y_label = data.graph_y_label;
          priceConfigQuery.pricing_model_id = data.pricing_model_id;

          // const moduleQuery = await Module.query();
          // moduleQuery.where("name", data.moduleName);
          // const moduleResult = moduleQuery.fetch();
          const moduleResult = await Module.query().where("name", data.moduleName).fetch();
          //console.log(moduleResult);

          let parsedModuleResult;

          if (moduleResult) {
            parsedModuleResult = moduleResult.toJSON();
            console.log(parsedModuleResult);
            if (parsedModuleResult) {
              priceConfigQuery.category_id = parsedModuleResult[0].category_id ? parsedModuleResult[0].category_id: null;
              priceConfigQuery.module_id = parsedModuleResult[0].id ? parsedModuleResult[0].id: null;
            }
          }
          console.log(priceConfigQuery.name);
          const priceConfigQuerycheck = PricingConfiguration.query();
          const priceConfigexistingid = await priceConfigQuerycheck.whereRaw("name = (?) AND module_id = (?)", [priceConfigQuery.name,parsedModuleResult[0].id]).pluck("id");
          console.log(priceConfigexistingid);
          let priceConfigurationId = 0;
          
          if(priceConfigexistingid && priceConfigexistingid.length > 0) {
            priceConfigurationId = priceConfigexistingid;
          } else {
            await priceConfigQuery.save();
            priceConfigurationId = priceConfigQuery.id;
          }
          

          const queryPCRM = new PricingCongfigurationRegionMapping();

          queryPCRM.pricing_config_id = priceConfigurationId;

          if (data.country_groups_id && data.country_groups_id == 99999) {
            queryPCRM.country_groups_id = null;
            queryPCRM.has_all_country = "1";
          }else if(data.country_groups_id && data.country_groups_id == 0){
            queryPCRM.country_groups_id = null;
            queryPCRM.has_all_country = "1";              
          } else {
            queryPCRM.country_groups_id = data.country_groups_id;
          }

          queryPCRM.year = data.year;
          queryPCRM.deal_size = data.deal_size;

          const queryPCRMcheck = PricingCongfigurationRegionMapping.query();

          const pcrmexistids =  await queryPCRMcheck.whereRaw("pricing_config_id = (?) AND country_groups_id = (?) AND year = (?)",[priceConfigurationId, queryPCRM.country_groups_id, queryPCRM.year]).pluck("id");
          if(pcrmexistids && pcrmexistids.length > 0){
            

            const queryPCPM = new PricingConfigurationPriceMapping();
            queryPCPM.region_mapping_id = pcrmexistids;

            queryPCPM.avgprice = data.avgprice;
            await queryPCPM.save();

          } else {
            await queryPCRM.save();
            let PCRMId = queryPCRM.id;

            const queryPCPM = new PricingConfigurationPriceMapping();
            queryPCPM.region_mapping_id = PCRMId;

            queryPCPM.avgprice = data.avgprice;
            await queryPCPM.save();

          }
          

        } catch (error) {
          console.log(error);
          return response.status(423).send({
              message: "Something went wrong",
            });
        }
      }


      return response.status(200).send({ message: 'Data Imported successfully UPDATED' })

    })

    await request.multipart.process()
  }

}

module.exports = PricingInsightsController
