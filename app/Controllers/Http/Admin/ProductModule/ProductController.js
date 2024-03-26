"use strict";

const Excel = require("exceljs");
const Helpers = use("Helpers");
const axios = use("axios");
const Product = use("App/Models/Product");
const Module = use("App/Models/Admin/ProductModule/Module");
const Flow = use("App/Models/Admin/ProductModule/Flow");
const FlowQuestion = use("App/Models/Admin/ProductModule/FlowQuestion");
const Question = use("App/Models/Admin/ProductModule/Question");
const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const NewVendor = use("App/Models/Admin/VendorModule/NewVendors");
const ModuleVendor = use("App/Models/Admin/VendorModule/ModuleVendor");
const CountryGroup = use("App/Models/Admin/LocationModule/CountryGroup");
const LoggerDebug = use("Logger");

const requestOnly = [
  "name",
  "vendor",
  "moduleId",
  "rating",
  "notes",
  "link",
  "countryCategories",
  "questions",
];
class ProductController {
  async export({ request, response }) {
    const fileName = "products.xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Sheet 1");
    let font = { name: "Arial", size: 12 };

    let columns = [
      { header: "name", key: "name", width: 10, style: { font: font } },
      {
        header: "updated name",
        key: "updatedName",
        width: 10,
        style: { font: font },
      },
      { header: "vendor", key: "vendor", width: 10, style: { font: font } },
      { header: "module", key: "module", width: 10, style: { font: font } },
      { header: "rating", key: "rating", width: 10, style: { font: font } },
      { header: "notes", key: "notes", width: 10, style: { font: font } },
      { header: "link", key: "link", width: 10, style: { font: font } },
    ];
    const CountryGroupQuery = CountryGroup.query();
    const countryGroups = await CountryGroupQuery.fetch();
    const countryGroupsData = countryGroups.toJSON();
    let countryGroupsHeader = "";
    if (countryGroupsData) {
      countryGroupsData.forEach((countryGroupElement) => {
        countryGroupsHeader += `${countryGroupElement.id}. ${countryGroupElement.name}\n`;
      });

      columns.push({
        header: countryGroupsHeader,
        key: "countryCategories",
        width: 10,
        style: { font: font },
      });
    }

    const moduleId = request.input("moduleId");
    let result;
    if (moduleId) {
      const moduleId = request.input("moduleId");
      //const moduleQuery = await Module.findOrFail(moduleId)
      //result = await Product.find({ module: moduleQuery.name.trim() });
      result = await Product.find({
        moduleId: moduleId,
      });
      if (result.length) {
        let products = [];
        for (let index = 0; index < result.length; index++) {
          const element = result[index];
          let module;
          if (element.moduleId) {
            const moduleQuery = await Module.find(element.moduleId);
            if (moduleQuery) {
              module = moduleQuery.name;
            }
          }
          products.push({
            name: element.name,
            vendor: element.vendor,
            module: module,
            rating: element.rating,
            notes: element.notes,
            link: element.link,
            countryCategories: element.countryCategories,
            questions: element.questions,
          });
        }

        result = products;
      }

      const flowQuery = await Flow.findByOrFail("module_id", moduleId);
      const questionIdsQuery = FlowQuestion.query();
      questionIdsQuery.where("flow_id", flowQuery.id);
      questionIdsQuery.orderBy("question_id");
      const questionIds = await questionIdsQuery.pluck("question_id");
      const questionQuery = Question.query();
      questionQuery.whereIn("id", questionIds);
      questionQuery.orderBy("id");
      questionQuery.with("options.sub_options");
      const questions = await questionQuery.fetch();
      const questionData = questions.toJSON();
      let optionJson;

      if (questionData) {
        questionData.forEach((element) => {
          optionJson = "";
          element.options.forEach((optionElement, index) => {
            optionJson += `${optionElement.id}. ${optionElement.name}\n`;

            if (optionElement.sub_options && optionElement.sub_options.length) {
              optionJson += `--------------\n`;
              optionElement.sub_options.forEach((subOption) => {
                optionJson += `${subOption.id}. ${subOption.name}\n`;
              });
              optionJson += `--------------\n`;
            }
          });

          const questionHeader = `${element.name}\n${optionJson}`;
          columns.push({
            header: questionHeader,
            key: element.id,
            width: 10,
            style: { font: font },
          });
        });
      }
    } else {
      result = await Product.find();
      if (result.length) {
        let products = [];
        for (let index = 0; index < result.length; index++) {
          const element = result[index];
          let module;
          if (element.moduleId) {
            const moduleQuery = await Module.find(element.moduleId);
            if (moduleQuery) {
              module = moduleQuery.name;
            }
          }
          products.push({
            name: element.name,
            vendor: element.vendor,
            module: module,
            rating: element.rating,
            notes: element.notes,
            link: element.link,
            countryCategories: element.countryCategories,
            questions: element.questions,
          });
        }

        result = products;
      }
    }

    worksheet.columns = columns;
    let rowArray = [];
    result.forEach((element) => {
      rowArray = {
        name: element.name,
        vendor: element.vendor,
        module: element.module,
        rating: element.rating,
        notes: element.notes,
        link: element.link,
        countryCategories: element.countryCategories
          ? element.countryCategories.join(",")
          : "",
      };
      if (moduleId) {
        if (element.questions) {
          element.questions.forEach((questionElement) => {
            if (Array.isArray(questionElement.value)) {
              let optionWithPriorityArray = [];
              questionElement.value.forEach((option, index) => {
                let tempOption = option;
                if (
                  questionElement.subValue &&
                  questionElement.subValue.length
                ) {
                  const subValue = questionElement.subValue.filter(
                    (e) => e.id == option
                  );
                  if (subValue && subValue.length) {
                    tempOption = `${option}:${subValue[0].value.join(":")}`;
                  }
                }
                if (
                  questionElement.priority &&
                  questionElement.priority.length
                ) {
                  const priority = questionElement.priority.filter(
                    (e) => e.id == option
                  );
                  if (priority && priority.length) {
                    tempOption = `${tempOption}/${priority[0].value.join("-")}`;
                  }
                }

                optionWithPriorityArray[index] = tempOption;
              });
              // rowArray[questionElement.id] = questionElement.value.join(",");
              rowArray[questionElement.id] = optionWithPriorityArray.join(",");
            } else {
              if (questionElement.priority && questionElement.priority.length) {
                rowArray[
                  questionElement.id
                ] = `${questionElement.value}/${questionElement.priority[0].value}`;
              } else {
                rowArray[questionElement.id] = questionElement.value;
              }
            }
          });
        }
      }

      worksheet.addRow(rowArray);
    });

    worksheet.getCell("C1", "D1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "cccccc" },
    };

    response.header(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    );
    response.header(`Content-Disposition`, `attachment; filename="${fileName}`);
    return workbook.xlsx.writeBuffer(response);
  }

  async import({ request, response }) {
    const validationOptions = {
      types: [
        "xls",
        "xlsx",
        "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    };

    const moduleId = request.input("moduleId");

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
      let productData = [];
      let checkModuleName;
      let vendor;
      let checkModuleQuery;
      let countryCategoriesData;
      let questionIds = [];
      if (moduleId) {
        const flowQuery = await Flow.findByOrFail("module_id", moduleId);
        const questionIdsQuery = FlowQuestion.query();
        questionIdsQuery.where("flow_id", flowQuery.id);
        questionIdsQuery.orderBy("question_id");
        questionIds = await questionIdsQuery.pluck("question_id");
      }

      worksheet.eachRow(
        { includeEmpty: true },
        async function (row, rowNumber) {
          rowData = JSON.parse(JSON.stringify(row.values));
          if (rowNumber !== 1 && rowData.length) {
            var countries = String(rowData[8]);
            var arrCountries = [];
            if (countries) {
              if (countries.includes(",")) {
                arrCountries = rowData[8].split(",");
              } else {
                arrCountries.push(rowData[8]);
              }
            }
            vendor = rowData[3];
            checkModuleName = rowData[4];
            countryCategoriesData = arrCountries;

            var bodyData = {
              name: rowData[1],
              updatedName: rowData[2],
              vendor: rowData[3],
              rating: rowData[5],
              notes: rowData[6],
              countryCategories: countryCategoriesData,
              link: rowData[7],
              module: checkModuleName,
            };

            if (moduleId) {
              let questions = [];
              let questionId = 0;
              for (let index = 9; index < rowData.length; index++) {
                let value = [];
                let subValue = [];
                let priority = [];
                let stringValue = String(rowData[index]);

                stringValue = stringValue.replace(" ", "");

                if (stringValue.includes(",")) {
                  const valueTemp = stringValue.split(",");
                  if (valueTemp) {
                    valueTemp.forEach((element) => {
                      if (element.includes(":")) {
                        const subValueTemp = element.split(":");
                        let subValueFinal = [];
                        let optionId;
                        if (subValueTemp) {
                          subValueTemp.forEach(
                            (subValueElement, subValueIndex) => {
                              if (subValueIndex) {
                                if (subValueElement.includes("/")) {
                                  const optionIdTemp =
                                    subValueElement.split("/")[0];
                                  subValueFinal.push(optionIdTemp);
                                } else {
                                  subValueFinal.push(subValueElement);
                                }
                              } else {
                                optionId = subValueElement;
                                value.push(subValueElement);
                              }
                            }
                          );

                          subValue.push({
                            id: optionId,
                            value: subValueFinal,
                          });
                        }
                      }

                      if (element.includes("/")) {
                        const priorityTemp = element.split("/");
                        let priorityFinal = null;
                        let optionId;
                        if (priorityTemp) {
                          priorityTemp.forEach(
                            (priorityElement, priorityIndex) => {
                              if (priorityIndex) {
                                priorityFinal = priorityElement.split("-");
                              } else {
                                if (priorityElement.includes(":")) {
                                  const optionIdTemp =
                                    priorityElement.split(":")[0];
                                  optionId = optionIdTemp;
                                } else {
                                  optionId = priorityElement;
                                  value.push(priorityElement);
                                }
                              }
                            }
                          );

                          priority.push({
                            id: optionId,
                            value: priorityFinal,
                          });
                        }
                      }

                      if (!element.includes(":") && !element.includes("/")) {
                        value.push(element);
                      }
                    });
                  }
                } else {
                  value = stringValue;
                }
                questions.push({
                  id: questionIds[questionId],
                  value: value,
                  subValue: subValue,
                  priority: priority,
                });
                questionId++;
              }
              bodyData["questions"] = questions;
              bodyData["moduleId"] = moduleId;
            } else {
              // if (checkModuleName) {
              //     checkModuleQuery = await Module.findBy('name', checkModuleName)
              //     if (!checkModuleQuery) {
              //         //return response.status(404).send({ message: `Module ${checkModuleName} not found` })
              //     } else {
              //         bodyData = { ...bodyData, moduleId: checkModuleQuery.id }
              //     }
              // }
            }

            productData.push(bodyData);
          }
        }
      );

      for (var i = 0; i < productData.length; i++) {
        let data = productData[i];
        let checkModuleName = data.module.trim();

        var finalData = {
          name: data.name.trim(),
          vendor: data.vendor.trim(),
          rating: data.rating,
          notes: data.notes,
          countryCategories: data.countryCategories,
          link: data.link,
          module: checkModuleName,
        };

        if (moduleId) {
          finalData = {
            ...finalData,
            questions: data.questions,
            moduleId: moduleId,
          };
        } else {
          if (checkModuleName) {
            checkModuleQuery = await Module.findBy("name", checkModuleName);
            if (!checkModuleQuery) {
              //return response.status(404).send({ message: `Module ${checkModuleName} not found` })
            } else {
              finalData = { ...finalData, moduleId: checkModuleQuery.id };
            }
          }
        }

        if (data.vendor) {
          var dataNeedToAdd = false;
          const vendorQuery = await Vendor.findBy("name", data.vendor.trim());
          if (!vendorQuery) {
            //Vendor.create({ name: vendor, email: '' })
            //log error
            //Check for another table
            const findVendorQuery = await NewVendor.findBy(
              "name",
              data.vendor.trim()
            );
            if (!findVendorQuery) {
              LoggerDebug.transport("productimport").info(
                `Vendor name: ${data.vendor}; Product name: ${data.name}; Product Link : ${data.link}`
              );
              dataNeedToAdd = false;
            } else {
              dataNeedToAdd = true;
              finalData = {
                ...finalData,
                vendor: findVendorQuery.vendor_name.trim(),
              };
              await ModuleVendor.findOrCreate(
                { vendor_id: findVendorQuery.vendor_id, module_id: moduleId },
                { vendor_id: findVendorQuery.vendor_id, module_id: moduleId }
              );
            }
            //Need to add Product
          } else {
            dataNeedToAdd = true;
            await ModuleVendor.findOrCreate(
              { vendor_id: vendorQuery.id, module_id: moduleId },
              { vendor_id: vendorQuery.id, module_id: moduleId }
            );
          }

          if (dataNeedToAdd == true) {
            // check and update table module_vendors 04-10-2022

            const query = await Product.findOne({
              name: finalData.name,
              moduleId: finalData.moduleId,
              vendor: finalData.vendor,
            });
            if (query && query._id) {
              if (
                data.updatedName &&
                data.updatedName != null &&
                data.updatedName != undefined
              ) {
                finalData = {
                  ...finalData,
                  name: data.updatedName.trim(),
                };

                await Product.findOneAndDelete({ _id: query._id });

                if (data.updatedName.trim().toLowerCase() == "delete") {
                  //Deleting data
                  //  await Product.findOneAndDelete({ _id: query._id });
                } else {
                  await Product.findOneAndUpdate(
                    { _id: query._id },
                    finalData,
                    {
                      upsert: true,
                      new: true,
                    }
                  );
                }
              } else {
                await Product.findOneAndUpdate({ _id: query._id }, finalData, {
                  upsert: true,
                  new: true,
                });
              }
            } else {
              if (
                data.updatedName &&
                data.updatedName != null &&
                data.updatedName != undefined
              ) {
                const query1 = await Product.findOne({
                  name: data.updatedName.trim(),
                  moduleId: finalData.moduleId,
                  vendor: finalData.vendor,
                });

                if (query && query._id) {
                  //Update
                  if (data.updatedName.trim().toLowerCase() == "delete") {
                    //Deleting data
                  } else {
                    finalData = {
                      ...finalData,
                      name: data.updatedName.trim(),
                    };
                    await Product.findOneAndDelete({ _id: query._id });
                    await Product.findOneAndUpdate(
                      { _id: query1._id },
                      finalData,
                      {
                        upsert: true,
                        new: true,
                      }
                    );
                  }
                } else {
                  //Check Updated Name is not delete function
                  if (data.updatedName.trim().toLowerCase() == "delete") {
                    //Ignore it
                  } else {
                    finalData = {
                      ...finalData,
                      name: data.updatedName.trim(),
                    };
                    //Save
                    await Product.create(finalData);
                  }
                }
              } else {
                await Product.create(finalData);
              }
            }
          }
        }
      }
    });

    await request.multipart.process();

    return response.status(200).send({ message: "Create successfully" });
  }

  async index({ response, request }) {
    const customFilter = JSON.parse(request.input("customFilter"));
    let page = null;
    let pageSize = null;

    if (request.input("page")) {
      page = parseInt(request.input("page"));
    }
    if (request.input("pageSize")) {
      pageSize = parseInt(request.input("pageSize"));
    }
    console.log("customFilter", customFilter);
    var filter = {};
    if (customFilter && customFilter.length) {
      for (let index = 0; index < customFilter.length; index++) {
        const { value, field } = customFilter[index];
        if (field == "name") {
          filter.name = { $regex: new RegExp(value, "i") };
        }
        if (field == "vendor") {
          filter.vendor = { $regex: new RegExp(value, "i") };
        }
        if (field == "module") {
          // const module = await Module.findBy("name", value);
          const moduleQuery = Module.query();
          moduleQuery.whereRaw("name=? and status=?", [value, 1]);
          const [module] = (await moduleQuery.fetch()).toJSON();
          if (module) {
            filter.moduleId = module.id; //{ $regex: new RegExp(module.id, "i") };
          }
        }
      }
    }

    var result;
    if (page && pageSize) {
      result = await Product.find(filter)
        .skip(pageSize * (page - 1))
        .limit(pageSize)
        .sort({ name: 1 });
    } else {
      result = await Product.find(filter).limit(10).sort({ name: 1 });
    }
    const totalProduct = await Product.countDocuments(filter);

    // const result = await Product.find(filter).limit(5);
    let products = [];
    if (result.length) {
      for (let index = 0; index < result.length; index++) {
        const element = result[index];
        let module;
        let flowAdded = false;
        if (element.moduleId) {
          const moduleQuery = await Module.find(element.moduleId);
          if (moduleQuery) {
            module = moduleQuery.name;
          }

          const flowQuery = await Flow.findBy("module_id", element.moduleId);
          if (flowQuery) {
            flowAdded = true;
          }
        }

        products.push({
          countryCategories: element.countryCategories,
          questions: element.questions,
          _id: element._id,
          name: element.name,
          vendor: element.vendor,
          module: module,
          rating: element.rating,
          notes: element.notes,
          moduleId: element.moduleId,
          flowAdded: flowAdded,
        });
      }
    }

    const pagination = {
      data: products,
      lastPage: Math.ceil(totalProduct / pageSize),
      page: page,
      perPage: pageSize,
      total: totalProduct,
    };

    return response.status(200).send(pagination);
  }

  async store({ request, response }) {
    var body = request.only(requestOnly);
    const moduleData = await Module.findOrFail(body.moduleId);
    body.module = moduleData.name;
    let countryCategories = JSON.parse(body.countryCategories);
    let countryCategoriesData = [];
    if (countryCategories) {
      countryCategories.forEach((element) => {
        countryCategoriesData.push(String(element));
      });
    }
    body.countryCategories = countryCategoriesData;
    body.questions = JSON.parse(body.questions);
    await Product.create(body);
    return response.status(200).send({ message: "Create successfully" });
  }

  async show({ params, response }) {
    const query = await Product.findOne({ _id: params.id });
    const productData = query.toJSON();
    const CountryGroupQuery = CountryGroup.query();
    CountryGroupQuery.whereIn("id", productData.countryCategories);
    const countryGroups = await CountryGroupQuery.fetch();
    productData.countryGroups = countryGroups;

    if (productData.moduleId) {
      const moduleData = await Module.find(productData.moduleId);
      productData.categoryId = moduleData.category_id;
    } else {
      productData.categoryId = "";
    }
    return response.status(200).send(productData);
  }

  async update({ params, request, response }) {
    var body = request.only(requestOnly);
    const moduleData = await Module.findOrFail(body.moduleId);
    body.module = moduleData.name;
    let countryCategories = JSON.parse(body.countryCategories);
    let countryCategoriesData = [];
    if (countryCategories) {
      countryCategories.forEach((element) => {
        countryCategoriesData.push(String(element));
      });
    }
    body.countryCategories = countryCategoriesData;
    body.questions = JSON.parse(body.questions);
    await Product.findOneAndUpdate({ _id: params.id }, body, {
      upsert: true,
      new: true,
    });
    return response.status(200).send({ message: "Update successfully" });
  }

  async destroy({ params, response }) {
    await Product.findOneAndDelete({ _id: params.id });
    return response.status(200).send({ message: "Delete successfully" });
  }

  async bulkDestroy({ request, response }) {
    const ids = JSON.parse(request.input("ids"));
    if (ids) {
      ids.forEach(async (element) => {
        await Product.findOneAndDelete({ _id: element });
      });
    }
    return response.status(200).send({ message: "Delete successfully" });
  }
}

module.exports = ProductController;
