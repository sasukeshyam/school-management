const paginate = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, parseInt(query.limit) || 10);
  const skip  = (page - 1) * limit;
  const sort  = query.sort || '-created_at';
  return { page, limit, skip, sort };
};

const buildFilter = (query, allowedFields) => {
  const filter = {};
  allowedFields.forEach((field) => {
    if (query[field] !== undefined && query[field] !== '') {
      filter[field] = query[field];
    }
  });
  if (query.search && query.searchFields) {
    const fields = Array.isArray(query.searchFields) ? query.searchFields : [query.searchFields];
    filter.$or = fields.map((f) => ({ [f]: { $regex: query.search, $options: 'i' } }));
  }
  return filter;
};

module.exports = { paginate, buildFilter };
