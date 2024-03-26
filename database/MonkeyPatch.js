const KnexQueryBuilder = require("knex/lib/query/builder");
const _ = require("lodash");
async function paginate(page = 1, perPage = 20) {
  const excludeAttrFromCount = ["order", "columns", "limit", "offset"];
  const excludeSubAttrFromCount = [
    "join",
    "order",
    "columns",
    "group",
    "limit",
    "offset",
    "where",
  ];
  const countByQuery = this.clone();
  const subByQuery = this.clone();
  /**
   * Copy the subQuery fn to the clone query. This will make sure
   * that build uses the extended query builder methods on the
   * cloned query too
   */
  countByQuery.subQuery = this.subQuery;

  /**
   * Force cast page and perPage to numbers
   */
  page = Number(page);
  perPage = Number(perPage);

  /**
   * Remove statements that will make things bad with count
   * query, for example `orderBy`
   */
  countByQuery._statements = _.filter(countByQuery._statements, (statement) => {
    return excludeAttrFromCount.indexOf(statement.grouping) < 0;
  });

  subByQuery._statements = _.filter(subByQuery._statements, (statement) => {
    return excludeSubAttrFromCount.indexOf(statement.grouping) < 0;
  });

  const counts = await subByQuery.count("* as total").from({
    main: countByQuery.select(this.client.raw("'total'")),
  });

  // const counts = await countByQuery.count('* as total')
  const total = _.get(counts, "0.total", 0);
  const data = total === 0 ? [] : await this.forPage(page, perPage);

  return {
    total: total,
    perPage: perPage,
    page: page,
    lastPage: Math.ceil(total / perPage),
    data: data,
  };
}

KnexQueryBuilder.prototype.paginate = paginate;
