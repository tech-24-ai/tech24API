const { KEYS } = require("../Helper/constants");
const Badge = use("App/Models/Admin/CommunityModule/Badge");
const CommunityVisitorPoint = use("App/Models/Admin/CommunityModule/CommunityVisitorPoint");

async function getvisitorCurrentLevel(visitorId) {
  
  const query = CommunityVisitorPoint.query();
  query.select('id','visitor_id')
  query.where("visitor_id", visitorId);
  query.sum('points as totalPoints')
  const result1 = await query.first();
  let totalPoints = result1.totalPoints;
  totalPoints = (totalPoints > 0) ? totalPoints : 0;

  const badgeQuery = Badge.query()
  badgeQuery.where('min_range', '<=', totalPoints)
  badgeQuery.where('max_range', '>=', totalPoints)
  const badgeResult = await badgeQuery.first();
  let currectBadge = (badgeResult) ? badgeResult.title : '';

  const badgeListsQuery = Badge.query();
  badgeListsQuery.select('id', 'title', 'min_range', 'max_range')
  badgeListsQuery.orderBy('min_range', 'ASC')
  let badgeListResult = (await badgeListsQuery.fetch()).toJSON();

  let current_level = 0;
  if(totalPoints > 0 && badgeListResult)
  {
    badgeListResult.forEach((val, index) => {
      if(val.min_range <= totalPoints && val.max_range >= totalPoints) {
        current_level = index + 1;
      }
    });
  }

  return current_level;
}


module.exports = {
  getvisitorCurrentLevel,
};
