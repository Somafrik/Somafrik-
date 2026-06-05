class PaginationService {
  constructor({ defaultLimit = 25, maxLimit = 100 } = {}) {
    this.defaultLimit = defaultLimit;
    this.maxLimit = maxLimit;
  }

  paginate(rows, query = {}, searchableFields = []) {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || this.defaultLimit, 1), this.maxLimit);
    const search = String(query.search ?? "").trim().toLowerCase();
    const sort = String(query.sort ?? "").trim();
    const filtered = search
      ? rows.filter((row) =>
          searchableFields.some((field) => String(row[field] ?? "").toLowerCase().includes(search))
        )
      : [...rows];

    if (sort) {
      const descending = sort.startsWith("-");
      const field = descending ? sort.slice(1) : sort;
      filtered.sort((left, right) =>
        String(left[field] ?? "").localeCompare(String(right[field] ?? ""), "fr", { numeric: true }) *
        (descending ? -1 : 1)
      );
    }

    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        sort: sort || null,
        search: search || null,
      },
    };
  }
}

module.exports = { PaginationService };
