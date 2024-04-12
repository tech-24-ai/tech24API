"use strict";

const Document = use("App/Models/Admin/DocumentModule/Document");
const Purchase = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuDocPurchase"
);
const ResearchTag = use("App/Models/Admin/DocumentModule/ResearchTag");
const Query = use("Query");
const moment = require("moment");
const Excel = require("exceljs");
const {
  fetchVimeoVideoThumbnail,
} = require("../../../../Helper/basicInfoScraper");
const searchInFields = [
  "documents.id",
  "documents.name",
  // "documents.price",
  "document_types.name",
  "documents.description",
  "documents.subscription_category",
];
class DocumentController {
  //Document Category => 1: Module Documents, 2: Template Toolkit Documents
  async index({ request, response, view }) {
    const query = Document.query();
    query.select("documents.*");
    query.select("document_types.name as document_type");

    query.leftJoin(
      "document_types",
      "document_types.id",
      "documents.document_type_id"
    );
    query.with('category_name', (builder) => {
      builder.select('id', 'name')
    });
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

    if (request.input("document_type_id")) {
      query.where(
        "documents.document_type_id",
        request.input("document_type_id")
      );
    }

    if (request.input("subscription_cateogry")) {
      query.where(
        "documents.subscription_cateogry",
        request.input("subscription_cateogry")
      );
    }

    if (request.input("document_cateogry")) {
      query.where(
        "documents.document_cateogry",
        request.input("document_cateogry")
      );
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              `DATE(documents.${filter.name}) = '${moment(filter.value).format(
                "YYYY-MM-DD"
              )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              `DATE(documents.${filter.name}) = '${moment(filter.value).format(
                "YYYY-MM-DD"
              )}'`
            );
            break;
          case "document_type":
            query.whereRaw(`document_types.name LIKE '%${filter.value}%'`);
            break;
          case "category_name.name":
            query.whereHas('category_name', (builder) => {
              builder.whereRaw(`name LIKE '%${filter.value}%'`)
            })
          break;
          case "status":
            query.whereIn('status', filter.value);
          break; 
          default:
            query.whereRaw(`documents.${filter.name} LIKE '%${filter.value}%'`);
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

  async store({ request, response }) {
    const query = new Document();

    query.document_type_id = request.input("document_type_id");
    query.category_id = request.input("category_id");
    query.research_topic_id = request.input("research_topic_id");
    query.name = request.input("name");
    query.url = (request.input("url")) ? request.input("url") : "";
    // query.tag = request.input("tag");
    query.seo_url_slug = request.input("seo_url_slug");
    query.status = request.input("status");
    // query.is_embedded = request.input("is_embedded");
    var path = require("path");

    // if (query.url && query.url.includes("//vimeo.com/")) {
    //   query.url = query.url.replace("vimeo.com", "player.vimeo.com/video");
    // }

    // if (query.url && query.url.includes("//youtu.be/")) {
    //   query.url = query.url.replace(
    //     "youtu.be",
    //     "www.youtube-nocookie.com/embed"
    //   );
    //   let videoId = query.url.slice(query.url.lastIndexOf("/") + 1);
    //   query.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    // }

    var url = query.url;
    if (url) {
      const filename = url.replace(process.env.S3_BASE_URL, "");
      var extension = path.extname(filename);
      extension = extension.substring(1);
      if (extension == "") {
        extension = "";
      }
      query.extension = extension;
    }

    // if (url.includes("player.vimeo.com")) {
    //   let videoId = url.slice(url.lastIndexOf("/") + 1);
    //   const thumbnail = await fetchVimeoVideoThumbnail(videoId);
    //   if (thumbnail) {
    //     query.thumbnail = thumbnail;
    //   }
    // }

    query.details = request.input("details");
    query.description = request.input("description");
    query.document_category = request.input("document_category");
    // query.subscription_category = request.input("subscription_category");

    // if (query.subscription_category == 1) {
    //   //Basic
    //   //query.price = 0;
    //   query.basic_document_price = 0;
    //   query.basic_document_special_price = 0;
    //   query.advance_document_price = 0;
    //   query.advance_document_special_price = 0;
    // } else if (query.subscription_category == 2) {
    //   //Advance
    //   //query.price = 0;
    //   query.basic_document_price = request.input("basic_document_price");
    //   query.basic_document_special_price = request.input(
    //     "basic_document_special_price"
    //   );
    //   query.advance_document_price = 0;
    //   query.advance_document_special_price = 0;
    // } else {
    //   //Enterprise
    //   //query.price = 0;
    //   query.basic_document_price = request.input("basic_document_price");
    //   query.basic_document_special_price = request.input(
    //     "basic_document_special_price"
    //   );
    //   query.advance_document_price = request.input("advance_document_price");
    //   query.advance_document_special_price = request.input(
    //     "advance_document_special_price"
    //   );
    // }
    // console.log("Query", query);
    await query.save();

    if(request.input("tags")) {
      await query.documentTags().attach(JSON.parse(request.input("tags")));
    }  

    return response.status(200).send({ message: "Created successfully" });
  }

  async show({ params, request, response, view }) {
    const query = await Document.findOrFail(params.id);
    const document_type = await query.document_type().fetch();
    if (document_type) {
      query.document_type = document_type.name;
    } else {
      query.document_type = "";
    }
    const category_name = await query.category_name().fetch();
    if (category_name) {
      query.category_name = category_name.name;
    } else {
      query.category_name = "";
    }
    const topic_name = await query.researchTopic().fetch();
    if (topic_name) {
      query.topic_name = topic_name.title;
    } else {
      query.topic_name = "";
    }
    const tags = await query.documentTags().select('id','name').fetch();
    query.tags = tags;

    const st = query.status;
		query.status = st.toString();

    return response.status(200).send(query);
  }

  async update({ params, request, response }) {
    const query = await Document.findOrFail(params.id);
    query.category_id = request.input("category_id");
    query.research_topic_id = request.input("research_topic_id");
    query.document_type_id = request.input("document_type_id");
    query.name = request.input("name");
    query.url = (request.input("url")) ? request.input("url") : "";
    query.tag = request.input("tag");
    // if (query.url && query.url.includes("//vimeo.com/")) {
    //   query.url = query.url.replace("vimeo.com", "player.vimeo.com/video");
    // }

    // if (query.url && query.url.includes("//youtu.be/")) {
    //   query.url = query.url.replace(
    //     "youtu.be",
    //     "www.youtube-nocookie.com/embed"
    //   );
    //   let videoId = query.url.slice(query.url.lastIndexOf("/") + 1);
    //   query.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    // }

    var url = query.url;
    const filename = url.replace(process.env.S3_BASE_URL, "");
    var path = require("path");
    var extension = path.extname(filename);
    extension = extension.substring(1);
    if (extension == "") {
      extension = "";
    }
    query.extension = extension;

    // if (url.includes("player.vimeo.com")) {
    //   let videoId = url.slice(url.lastIndexOf("/") + 1);
    //   const thumbnail = await fetchVimeoVideoThumbnail(videoId);
    //   if (thumbnail) {
    //     query.thumbnail = thumbnail;
    //   }
    // }

    query.status = request.input("status");
    query.details = request.input("details");
    query.description = request.input("description");
    query.document_category = request.input("document_category");
    // query.subscription_category = request.input("subscription_category");
    query.seo_url_slug = request.input("seo_url_slug");
    // query.is_embedded = request.input("is_embedded");

    // if (query.subscription_category == 1) {
    //   //Basic
    //   //query.price = 0;
    //   query.basic_document_price = 0;
    //   query.basic_document_special_price = 0;
    //   query.advance_document_price = 0;
    //   query.advance_document_special_price = 0;
    // } else if (query.subscription_category == 2) {
    //   //Advance
    //   //query.price = 0;
    //   query.basic_document_price = request.input("basic_document_price");
    //   query.basic_document_special_price = request.input(
    //     "basic_document_special_price"
    //   );
    //   query.advance_document_price = 0;
    //   query.advance_document_special_price = 0;
    // } else {
    //   //Enterprise
    //   //query.price = 0;
    //   query.basic_document_price = request.input("basic_document_price");
    //   query.basic_document_special_price = request.input(
    //     "basic_document_special_price"
    //   );
    //   query.advance_document_price = request.input("advance_document_price");
    //   query.advance_document_special_price = request.input(
    //     "advance_document_special_price"
    //   );
    // }

    await query.documentTags().detach();
    if(request.input("tags")) {
      await query.documentTags().attach(JSON.parse(request.input("tags")));
    } 
    await query.save();

    return response.status(200).send({ message: "Updated successfully" });
  }

  async destroy({ params, request, response }) {
    const query = await Document.findOrFail(params.id);

    try {
      const isPurchased = await Purchase.findBy("document_id", params.id);
      if (isPurchased) {
        return response.status(423).send({
          message: "Can't delete this document as it has valid transactions",
        });
      } else {
        await query.delete();
        return response.status(200).send({ message: "Deleted successfully" });
      }
    } catch (error) {
      return response.status(423).send({ message: "Something went wrong" });
    }
  }

  //Document Category => 1: Module Documents, 2: Template Toolkit Documents
  async exportReport({ request, response, auth }) {
    const query = Document.query();
    query.select("documents.*");
    query.select("document_types.name as document_type");

    query.leftJoin(
      "document_types",
      "document_types.id",
      "documents.document_type_id"
    );

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

    if (request.input("document_type_id")) {
      query.where(
        "documents.document_type_id",
        request.input("document_type_id")
      );
    }

    if (request.input("subscription_cateogry")) {
      query.where(
        "documents.subscription_cateogry",
        request.input("subscription_cateogry")
      );
    }

    if (request.input("document_cateogry")) {
      query.where(
        "documents.document_cateogry",
        request.input("document_cateogry")
      );
    }

    if (request.input("filters")) {
      const filters = JSON.parse(request.input("filters"));
      filters.forEach((filter) => {
        switch (filter.name) {
          case "created_at":
            query.whereRaw(
              `DATE(documents.${filter.name}) = '${moment(filter.value).format(
                "YYYY-MM-DD"
              )}'`
            );
            break;
          case "updated_at":
            query.whereRaw(
              `DATE(documents.${filter.name}) = '${moment(filter.value).format(
                "YYYY-MM-DD"
              )}'`
            );
            break;
          case "document_type":
            query.whereRaw(`document_types.name LIKE '%${filter.value}%'`);
            break;
          default:
            query.whereRaw(`documents.${filter.name} LIKE '%${filter.value}%'`);
            break;
        }
      });
    }

    var result = await query.fetch();

    const fileName = "documents-" + moment().format("yyyy-MM-DD") + ".xlsx";
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Document List");
    let font = { name: "Arial", size: 12 };

    const data = await result.toJSON();
    let exportData = [];
    let index = 1;
    if (data) {
      data.forEach((element) => {
        let doccategory = "Module Documents";

        if (element.document_category == 2) {
          doccategory = "Template and Toolkits";
        }

        let subscategory = "Basic";

        if (element.subscription_category == 2) {
          subscategory = "Advance";
        } else if (element.subscription_category == 3) {
          subscategory = "Enterprise";
        } else {
          subscategory = "Basic";
        }

        exportData.push({
          sno: index++,
          name: element.name,
          document_type: element.document_type,
          description: element.description,
          document_category: doccategory,
          subscription_category: subscategory,
          basic_document_price: element.basic_document_price,
          basic_document_special_price: element.basic_document_special_price,
          advance_document_price: element.advance_document_price,
          advance_document_special_price:
            element.advance_document_special_price,
          created: element.created_at,
          updated: element.updated_at,
        });
      });
    }

    let columns = [
      { header: "S. No.", key: "sno", width: 10, style: { font: font } },
      {
        header: "Document Name",
        key: "name",
        width: 30,
        style: { font: font },
      },
      {
        header: "Document Type",
        key: "document_type",
        width: 30,
        style: { font: font },
      },
      {
        header: "Description",
        key: "description",
        width: 60,
        style: { font: font },
      },
      {
        header: "Document Category",
        key: "document_category",
        width: 30,
        style: { font: font },
      },
      {
        header: "Subscription Category",
        key: "subscription_category",
        width: 30,
        style: { font: font },
      },
      {
        header: "Basic Subscription Price in USD",
        key: "basic_document_price",
        width: 40,
        style: { font: font },
      },
      {
        header: "Basic Subscription Special Price in USD",
        key: "basic_document_special_price",
        width: 40,
        style: { font: font },
      },
      {
        header: "Advance Subscription Price in USD",
        key: "advance_document_price",
        width: 40,
        style: { font: font },
      },
      {
        header: "Advance Subscription Special Price in USD",
        key: "advance_document_special_price",
        width: 40,
        style: { font: font },
      },
      {
        header: "Created",
        key: "created_at",
        width: 30,
        style: { font: font },
      },
      {
        header: "Updated",
        key: "updated_at",
        width: 30,
        style: { font: font },
      },
    ];

    worksheet.getColumn(4).alignment = { wrapText: true };

    worksheet.columns = columns;
    worksheet.addRows(exportData);

    worksheet.getCell("B1", "C1").fill = {
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
}

module.exports = DocumentController;
