class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // filtering
    // deep copy of the query object
    const queryObj = { ...this.queryString };
    // fields that are excluded in the query
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // check the query and delete excluded fields from the query object
    excludedFields.forEach((el) => {
      delete queryObj[el];
    });

    // advance filtering
    // gte, gt, lt, lte => These are the operations for filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // simple way of filtering, creating a query and waiting the result of
    // the query by using promises
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // Sorting the results
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt _id');
    }

    return this;
  }

  limitFields() {
    // Field limiting
    if (this.queryString.fields) {
      const field = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(field);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    // Pagination
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 100;
    const skip = limit * (page - 1);
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
