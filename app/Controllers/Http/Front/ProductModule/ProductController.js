"use strict";

const Product = use("App/Models/Product");
const Industry = use("App/Models/Admin/ProductModule/Industry");
const IndustryVendor = use("App/Models/Admin/VendorModule/IndustryVendor");
const Country = use("App/Models/Admin/LocationModule/Country");
const CountryGroup = use("App/Models/Admin/LocationModule/CountryGroup");
const Page = use("App/Models/Page");
const SearchReport = use("App/Models/Report/SearchReport");
const SearchReportProduct = use("App/Models/Report/SearchReportProduct");
const Mail = use("Mail");
const Env = use("Env");
const puppeteer = require("puppeteer");

class ProductController {
  async index({ response, request }) {
    const query = SearchReport.query();
    query.select("search_reports.*");
    query.select("categories.name as category");
    query.select("modules.name as module");
    query.select("visitors.name as visitor");
    query.with("questions", (builder) => {
      builder.select("search_report_questions.*");
      builder.select("questions.name as question");
      builder
        .leftJoin(
          "questions",
          "questions.id",
          "search_report_questions.question_id"
        )
        .with("options", (optionBuilder) => {
          optionBuilder.select("search_report_options.*");
          optionBuilder.select("options.name as option");
          optionBuilder
            .leftJoin(
              "options",
              "options.id",
              "search_report_options.option_id"
            )
            .with("sub_options", (optionBuilder) => {
              optionBuilder.select("search_report_sub_options.*");
              optionBuilder.select("options.name as option");
              optionBuilder.leftJoin(
                "options",
                "options.id",
                "search_report_sub_options.sub_option_id"
              );
            });
        });
    });
    query.with("products", (builder) => {
      builder.select("search_report_products.*");
      builder.select("vendors.linkedin_logo as vendor_image");
      builder.leftJoin(
        "vendors",
        "vendors.name",
        "search_report_products.vendor"
      );
      builder.orderBy("search_report_products.rating", "desc");
      builder.orderBy("search_report_products.vendor", "asc");
    });
    query.withCount("questions");
    query.withCount("products");

    query.leftJoin("categories", "categories.id", "search_reports.category_id");
    query.leftJoin("modules", "modules.id", "search_reports.module_id");
    query.leftJoin("visitors", "visitors.id", "search_reports.visitor_id");
    query.where("search_reports.id", request.input("search_report_id"));

    const result = await query.first();
    const product = result.toJSON();
    return response.status(200).send(product.products);
  }

  async clicked({ params, response, request }) {
    const query = await SearchReportProduct.findOrFail(params.id);
    query.merge({
      is_clicked: true,
    });
    await query.save();
    return response.status(200).send({ message: "Update successfully" });
  }

  async generateProductHtml({ request, view }) {
    const query = SearchReport.query();
    query.select("search_reports.*");
    query.select("categories.name as category");
    query.select("modules.name as module");
    query.select("visitors.name as visitor");
    query.with("questions", (builder) => {
      builder.select("search_report_questions.*");
      builder.select("questions.name as question");
      builder
        .leftJoin(
          "questions",
          "questions.id",
          "search_report_questions.question_id"
        )
        .with("options", (optionBuilder) => {
          optionBuilder.select("search_report_options.*");
          optionBuilder.select("options.name as option");
          optionBuilder
            .leftJoin(
              "options",
              "options.id",
              "search_report_options.option_id"
            )
            .with("sub_options", (optionBuilder) => {
              optionBuilder.select("search_report_sub_options.*");
              optionBuilder.select("options.name as option");
              optionBuilder.leftJoin(
                "options",
                "options.id",
                "search_report_sub_options.sub_option_id"
              );
            });
        });
    });
    query.with("products");
    query.withCount("questions");
    query.withCount("products");

    query.leftJoin("categories", "categories.id", "search_reports.category_id");
    query.leftJoin("modules", "modules.id", "search_reports.module_id");
    query.leftJoin("visitors", "visitors.id", "search_reports.visitor_id");
    query.where("search_reports.id", request.input("search_report_id"));

    const result = await query.first();
    const resultData = await result.toJSON();

    const page = await Page.findBy("slug", "terms-of-use");

    return await view.render("productcontentnew", {
      title: "Products",
      result: resultData,
      termsHtml: page ? page.html : "",
    });
  }

  async generateHtml({ request, view }) {
    const query = SearchReport.query();
    query.select("search_reports.*");
    query.select("categories.name as category");
    query.select("modules.name as module");
    query.select("visitors.name as visitor");
    query.with("questions", (builder) => {
      builder.select("search_report_questions.*");
      builder.select("questions.name as question");
      builder
        .leftJoin(
          "questions",
          "questions.id",
          "search_report_questions.question_id"
        )
        .with("options", (optionBuilder) => {
          optionBuilder.select("search_report_options.*");
          optionBuilder.select("options.name as option");
          optionBuilder
            .leftJoin(
              "options",
              "options.id",
              "search_report_options.option_id"
            )
            .with("sub_options", (optionBuilder) => {
              optionBuilder.select("search_report_sub_options.*");
              optionBuilder.select("options.name as option");
              optionBuilder.leftJoin(
                "options",
                "options.id",
                "search_report_sub_options.sub_option_id"
              );
            });
        });
    });
    query.with("products");
    query.withCount("questions");
    query.withCount("products");

    query.leftJoin("categories", "categories.id", "search_reports.category_id");
    query.leftJoin("modules", "modules.id", "search_reports.module_id");
    query.leftJoin("visitors", "visitors.id", "search_reports.visitor_id");
    query.where("search_reports.id", request.input("search_report_id"));

    const result = await query.first();
    const resultData = await result.toJSON();

    const page = await Page.findBy("slug", "terms-of-use");

    return await view.render("productcontentnew", {
      title: "Products",
      result: resultData,
      termsHtml: page ? page.html : "",
    });
  }

  async exportPdf({ response, request, view }) {
    const query = SearchReport.query();
    query.select("search_reports.*");
    query.select("modules.name as module");
    query.leftJoin("modules", "modules.id", "search_reports.module_id");
    query.where("search_reports.id", request.input("search_report_id"));
    const result = await query.first();

    const fileName = `TECH24_${result.module}_Report.pdf`;

    const html = await this.generateProductHtml({ response, request, view });

    const headerhtml = await view.render("header");
    const footerhtml = await view.render("footer");

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: 0, bottom: 0, right: 0, left: 0 },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerhtml,
      footerTemplate: footerhtml,
    });
    await browser.close();

    response.header("Content-disposition", "attachment");
    response.header("content-type", "pdf");
    response.attachment(fileName);
    response.send(pdf);
  }

  async sendMail({ response, request, view, auth }) {
    const visitor = await auth.authenticator("visitorAuth").getUser();
    const user = visitor.toJSON();
    const fileName = "product.pdf";
    const html = await this.generateHtml({ response, request, view });
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({ format: "A4" });
    await browser.close();
    const result = await Mail.send(
      "productlistmail",
      {
        title: "Thanks for download products pdf",
        details: "Thanks for download products pdf",
        name: user.name,
      },
      (message) => {
        message.subject("Thanks for download products pdf");
        message.attachData(new Buffer(pdf), fileName);
        message.from(Env.get("MAIL_USERNAME"));
        message.to(visitor.email);
      }
    );
    return response
      .status(200)
      .send({ message: "Email Sent Successfully", result: result });
  }
}

module.exports = ProductController;
