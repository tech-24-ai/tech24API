"use strict";
const Mail = use("Mail");
const Env = use("Env");
const Document = use("App/Models/Admin/DocumentModule/Document");
const DocumentType = use("App/Models/Admin/DocumentModule/DocumentType");
const ModuleDocument = use("App/Models/Admin/ProductModule/ModuleDocument");
const CategoryDocument = use("App/Models/Admin/ProductModule/CategoryDocument");

const Purchase = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuDocPurchase"
);

const transactionHistory = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuTransactionHistory"
);
const Subcription = use(
  "App/Models/Admin/VisitorSubscriptionModule/ItmapEuSubcription"
);
const Drive = use("Drive");
class DocumentController {
  async index({ request, response }) {
    const query = DocumentType.query();
    const documentQuery = Document.query();

    if (request.input("module_id")) {
      const moduleDocumentQuery = ModuleDocument.query();
      moduleDocumentQuery.where("module_id", request.input("module_id"));
      const documentIds = await moduleDocumentQuery.pluck("document_id");

      // find document type
      documentQuery.whereIn("id", documentIds);
      const documentTypeIds = await documentQuery.pluck("document_type_id");
      query.whereIn("id", documentTypeIds);

      // fetch documents
      query.with("documents", (builder) => {
        builder
          .whereIn("id", documentIds)
          .select(
            "documents.document_type_id",
            "documents.extension",
            "documents.id",
            "documents.name",
            "documents.description",
            "documents.created_at",
            "documents.updated_at",
            "documents.subscription_category",
            "documents.basic_document_price",
            "documents.basic_document_special_price",
            "documents.advance_document_price",
            "documents.advance_document_special_price",
            "documents.document_category"
          );
      });
    }

    if (request.input("category_id")) {
      const categoryDocumentQuery = CategoryDocument.query();
      categoryDocumentQuery.where("category_id", request.input("category_id"));
      const documentIds = await categoryDocumentQuery.pluck("document_id");

      // find document type
      documentQuery.whereIn("id", documentIds);
      const documentTypeIds = await documentQuery.pluck("document_type_id");
      query.whereIn("id", documentTypeIds);

      // fetch documents
      query.with("documents", (builder) => {
        builder
          .whereIn("id", documentIds)
          .select(
            "documents.document_type_id",
            "documents.extension",
            "documents.id",
            "documents.name",
            "documents.description",
            "documents.created_at",
            "documents.updated_at",
            "documents.subscription_category",
            "documents.basic_document_price",
            "documents.basic_document_special_price",
            "documents.advance_document_price",
            "documents.advance_document_special_price",
            "documents.document_category"
          );
      });
    }

    const result = await query.fetch();
    return response.status(200).send(result);
  }

  async sendMail({ response, request, auth }) {
    const visitor = await auth.authenticator("visitorAuth").getUser();
    const query = await Document.findOrFail(request.input("document_id"));
    const s3Url = await Drive.disk("s3").getUrl("");
    const filename = query.url.replace(s3Url, "");
    const file = await Drive.disk("s3").getObject(filename);

    const email = request.input("email");
    const result = await Mail.send(
      "documentemail",
      {
        title: "Thanks for download report pdf",
        details: "Thanks for download report pdf",
      },
      (message) => {
        message.subject("Thanks for download report pdf");
        message.attachData(new Buffer(file.Body), filename);
        message.from(Env.get("MAIL_USERNAME"));
        message.to(visitor.email);
      }
    );

    return response
      .status(200)
      .send({ message: "Email send successfully!", result: result });
  }

  async types({ response, request }) {
    // const documentQuery = Document.query();

    // if (request.input("category_id")) {
    //   const categoryDocumentQuery = CategoryDocument.query();
    //   categoryDocumentQuery.where("category_id", request.input("category_id"));
    //   const documentIds = await categoryDocumentQuery.pluck("document_id");
    //   // find document type
    //   documentQuery.whereIn("id", documentIds);
    // }
    // const documentTypeIds = await documentQuery.pluck("document_type_id");
    // const documentTypeQuery = DocumentType.query();
    // documentTypeQuery.whereIn("id", documentTypeIds);
    // let result = await documentTypeQuery.fetch();
    // const array = await result.toJSON();

    // const objTools = {
    //   id: "tools",
    //   name: "Tools",
    //   seo_url_slug: "tools",
    // };
    // array.push(objTools);

    // const objCalculator = {
    //   id: "calculators",
    //   name: "Calculators",
    //   seo_url_slug: "calculator",
    // };
    // array.push(objCalculator);

    const documentTypeQuery = DocumentType.query();
    if (request.input("category_name")) {
      documentTypeQuery.where("category", request.input("category_name"));
    }
    let result = await documentTypeQuery.fetch();
    const array = await result.toJSON();

    return response.status(200).send(array);
  }

  async list({ response, request }) {
    const documentQuery = Document.query();
    const search = request.input("search_name");

    if (search) {
      documentQuery.where("name", "LIKE", `%${search}%`);
      documentQuery.orWhere("tag", "LIKE", `%${search}%`);
    }

    if (request.input("module_id")) {
      const moduleDocumentQuery = ModuleDocument.query();
      moduleDocumentQuery.where("module_id", request.input("module_id"));
      const documentIds = await moduleDocumentQuery.pluck("document_id");
      documentQuery.whereIn("id", documentIds);
    }

    if (request.input("document_type_id")) {
      documentQuery.where(
        "document_type_id",
        request.input("document_type_id")
      );
    }

    if (request.input("document_id")) {
      documentQuery.where("id", request.input("document_id"));
    }

    if (request.input("seo_url_slug")) {
      documentQuery.where("seo_url_slug", request.input("seo_url_slug"));
    }

    if (request.input("category_id")) {
      const categoryDocumentQuery = CategoryDocument.query();
      categoryDocumentQuery.where("category_id", request.input("category_id"));
      const documentIds = await categoryDocumentQuery.pluck("document_id");
      // find document type
      documentQuery.whereIn("id", documentIds);
    }

    documentQuery.select(
      "documents.id",
      "documents.name",
      "documents.extension",
      "documents.description",
      "documents.created_at",
      "documents.updated_at",
      "documents.subscription_category",
      "documents.basic_document_price",
      "documents.basic_document_special_price",
      "documents.advance_document_price",
      "documents.advance_document_special_price",
      "documents.document_category",
      "documents.seo_url_slug",
      "documents.is_embedded",
      "documents.thumbnail",
      "documents.tag"
    );

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
      result = await documentQuery.paginate(page, pageSize);
    } else {
      result = await documentQuery.fetch();
    }
    // const result = await documentQuery.fetch();
    return response.status(200).send(result);
  }

  async listdata({ response, request }) {
    const documentQuery = Document.query();
    const search = request.input("search_name");

    if (search) {
      documentQuery.where("name", "LIKE", `%${search}%`);
      documentQuery.orWhere("tag", "LIKE", `%${search}%`);
    }

    if (request.input("module_id")) {
      const moduleDocumentQuery = ModuleDocument.query();
      moduleDocumentQuery.where("module_id", request.input("module_id"));
      const documentIds = await moduleDocumentQuery.pluck("document_id");
      documentQuery.whereIn("id", documentIds);
    }

    if (request.input("document_type_id")) {
      documentQuery.where(
        "document_type_id",
        request.input("document_type_id")
      );
    }

    if (request.input("seo_url_slug")) {
      documentQuery.where("seo_url_slug", request.input("seo_url_slug"));
    }

    if (request.input("category_id")) {
      const categoryDocumentQuery = CategoryDocument.query();
      categoryDocumentQuery.where("category_id", request.input("category_id"));
      const documentIds = await categoryDocumentQuery.pluck("document_id");
      // find document type
      documentQuery.whereIn("id", documentIds);
    }

    documentQuery.select(
      "documents.id",
      "documents.name",
      "documents.extension",
      "documents.description",
      "documents.created_at",
      "documents.updated_at",
      "documents.subscription_category",
      "documents.basic_document_price",
      "documents.basic_document_special_price",
      "documents.advance_document_price",
      "documents.advance_document_special_price",
      "documents.document_category",
      "documents.seo_url_slug",
      "documents.is_embedded",
      "documents.thumbnail",
      "documents.tag"
    );

    documentQuery.orderBy("created_at", "desc");

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
      result = await documentQuery.paginate(page, pageSize);
    } else {
      result = await documentQuery.fetch();
    }

    // const result = await documentQuery.fetch();
    return response.status(200).send(result);
  }

  async listdata({ response, request, auth }) {
    const documentQuery = Document.query();
    const search = request.input("search_name");

    if (search) {
      documentQuery.where("name", "LIKE", `%${search}%`);
      documentQuery.orWhere("tag", "LIKE", `%${search}%`);
    }

    if (request.input("module_id")) {
      const moduleDocumentQuery = ModuleDocument.query();
      moduleDocumentQuery.where("module_id", request.input("module_id"));
      const documentIds = await moduleDocumentQuery.pluck("document_id");
      documentQuery.whereIn("id", documentIds);
    }

    if (request.input("document_type_id")) {
      documentQuery.where(
        "document_type_id",
        request.input("document_type_id")
      );
    }
    if (request.input("document_id")) {
      documentQuery.where("id", request.input("document_id"));
    }

    if (request.input("seo_url_slug")) {
      documentQuery.where("seo_url_slug", request.input("seo_url_slug"));
    }

    if (request.input("category_id")) {
      const categoryDocumentQuery = CategoryDocument.query();
      categoryDocumentQuery.where("category_id", request.input("category_id"));
      const documentIds = await categoryDocumentQuery.pluck("document_id");
      // find document type
      documentQuery.whereIn("id", documentIds);
    }

    documentQuery.select(
      "documents.id",
      "documents.name",
      "documents.extension",
      "documents.description",
      "documents.created_at",
      "documents.updated_at",
      "documents.subscription_category",
      "documents.basic_document_price",
      "documents.basic_document_special_price",
      "documents.advance_document_price",
      "documents.advance_document_special_price",
      "documents.document_category",
      "documents.seo_url_slug",
      "documents.is_embedded",
      "documents.thumbnail",
      "documents.tag"
    );

    documentQuery.orderBy("created_at", "desc");

    //documentQuery.leftJoin('itmap_eu_doc_purchases', 'itmap_eu_doc_purchases.document_id', 'documents.id');

    //documentQuery.leftJoin('itmap_eu_subcriptions', 'itmap_eu_subcriptions.plan_id', 'documents.subscription_category');

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
      result = await documentQuery.paginate(page, pageSize);
    } else {
      result = (await documentQuery.fetch()).toJSON();
    }

    // const result = (await documentQuery.fetch()).toJSON();

    const subquery = Subcription.query();
    subquery.whereRaw(`user_id = (?) AND is_active = (?)`, [
      auth.user.id,
      true,
    ]);
    const subres = await subquery.fetch();
    const [subresult] = subres.toJSON();

    let index = 0;

    for (index = 0; index < result.rows.length; index++) {
      result.rows[index].paymentstatus = 0;

      //Check if Visitor has purchased the document
      const purquery = await Purchase.query()
        .whereRaw(`user_id = (?) AND document_id = (?)`, [
          auth.user.id,
          result.rows[index].id,
        ])
        .fetch();

      const [purresult] = purquery.toJSON();

      if (purresult) {
        result.rows[index].paymentstatus = 2;
      } else {
        if (
          subresult &&
          subresult.plan_id >= result.rows[index].subscription_category
        ) {
          result.rows[index].paymentstatus = 1;
        } else {
          result.rows[index].paymentstatus = 0;
        }
      }
    }

    return response.status(200).send(result);
  }

  async checkDocPaymentStatus({ request, response, auth }) {
    let paymentstatus = 0;
    const documentQuery = await Document.query()
      .where("id", request.input("document_id"))
      .fetch();
    const [documentResult] = documentQuery.toJSON();
    let resp = "";

    const subquery = Subcription.query();
    subquery.whereRaw(`user_id = (?) AND is_active = (?)`, [
      auth.user.id,
      true,
    ]);
    const subres = await subquery.fetch();
    const [subresult] = subres.toJSON();

    if (
      subresult &&
      documentResult.subscription_category >= subresult.plan_id
    ) {
      resp = "Valid Subscribed Document";
      paymentstatus = 1;
    } else {
      console.log(documentResult.id);

      //Check if Visitor has purchased the document
      const purquery = Purchase.query();
      purquery.whereRaw(`user_id = (?) AND document_id = (?)`, [
        auth.user.id,
        documentResult.id,
      ]);
      const [purresult] = (await purquery.fetch()).toJSON();
      if (purresult) {
        resp = "Valid Purchased Document";

        paymentstatus = 2;
      } else {
        resp = "Document is not purchased/subscribed";

        paymentstatus = 0;
      }
    }

    return response
      .status(200)
      .send({ result: resp, paymentstatus: paymentstatus });
  }

  async children({ response }) {
    const query = DocumentType.query();

    //query.with('children')

    query.with("children", (builder) => {
      builder.select(
        "documents.document_type_id",
        "documents.id",
        "documents.extension",
        "documents.name",
        "documents.description",
        "documents.created_at",
        "documents.updated_at",
        "documents.subscription_category",
        "documents.basic_document_price",
        "documents.basic_document_special_price",
        "documents.advance_document_price",
        "documents.advance_document_special_price",
        "documents.document_category"
      );
    });

    const result = await query.fetch();
    return response.status(200).send(result);
  }
}

module.exports = DocumentController;
