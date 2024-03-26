const Vendor = use("App/Models/Admin/VendorModule/Vendor");
const VendorNewsLists = use("App/Models/Admin/VendorModule/VendorNewsLists");
const { API_TYPE } = require("../Helper/constants");
const logger = require("../Helper/logger");
const getRssFeeds = require("../Helper/rssFeeds");
const LoggerDebug = use("Logger");
const Rss = use("App/Models/Admin/MasterModule/Rss");
const _mapData = require("../Helper/mapper");

function filterNewItems(items, list) {
  let result = [];
  items.forEach((news) => {
    for (let index = 0; index < list.rows.length; index++) {
      let element = list.rows[index];

      if (news.title.includes(element.name)) {

        result.push({
          ...news,
          vendor_id: element.id,
          vendor_name: element.name,
        });
      }
    }
  });
  return result;
}

function formatRssData(trends) {
  return trends.map((x) => ({
    ...x,
    news_date: new Date(x.news_date),
  }));
}

async function fetchRssFeed(vendor_id, auth) {
  let response = [];
  const vendorLists = await Vendor.all();
  logger.logApi(API_TYPE.RSS_FEEDS, vendor_id, auth.user.id);
  const { rows } = await Rss.all();
  for (let index = 0; index < rows.length; index++) {
    try {
      const element = rows[index];
    
      let data = await getRssFeeds(element.url);
      let result = filterNewItems(data.items, vendorLists);
      if (result.length > 0) {
        let news = _mapData(
          result,
          ["title", "link", "isoDate", "vendor_id", "vendor_name", "content"],
          ["news_title", "news_link", "news_date", "vendor_id", "vendor_name", "news_description"],
          {
            is_news_active: true,
            news_source: element.id,
            is_api_extracted: true,
          }
        );
        news = formatRssData(news);

        LoggerDebug.transport("cronfile").info(`News Result ${JSON.stringify(news)}`);
        news.forEach(async (item) => {
          try {
            const existsNews = await VendorNewsLists.findBy({
              news_link: item.news_link,
              vendor_id: item.vendor_id,
            });
            if (!existsNews) {
              response.push(item.vendor_name);
              delete item.vendor_name;
              await VendorNewsLists.create(item);
            }
          } catch (ex) {
            LoggerDebug.transport("cronfile").info(`News Error 1 ${JSON.stringify(ex)}`);

            response.push("message: Error for " + element.url + " - " + ex.message);
          }
        });
      }
    } catch (ex) {
      LoggerDebug.transport("cronfile").info(`News Error 2 ${JSON.stringify(ex)}`);
      
      let message = "message:" + rows[index].url + " having error as " +ex.message;
      response.push(message );
    }
  }
  return response;
}
module.exports = fetchRssFeed;
