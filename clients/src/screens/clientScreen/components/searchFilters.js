// One choice instead of separate "sort by" + "order" controls.
export const SORT_OPTIONS = [
  {id: 'rating', label: 'Đánh giá cao', sortBy: 'rating', order: 'desc'},
  {id: 'price_asc', label: 'Giá thấp → cao', sortBy: 'hourlyRate', order: 'asc'},
  {id: 'price_desc', label: 'Giá cao → thấp', sortBy: 'hourlyRate', order: 'desc'},
  {id: 'experience', label: 'Nhiều kinh nghiệm', sortBy: 'experienceYears', order: 'desc'},
];

export const EMPTY_FILTERS = {location: '', minRate: '', maxRate: '', sort: 'rating'};

export const countActiveFilters = filters =>
  [filters.location, filters.minRate || filters.maxRate, filters.sort !== 'rating'].filter(Boolean).length;

// Query params for clientApi.searchPTs.
export const buildSearchParams = ({query, specialization, filters, pageNumber, pageSize}) => {
  const sort = SORT_OPTIONS.find(option => option.id === filters.sort) || SORT_OPTIONS[0];
  const params = {pageNumber, pageSize, sortBy: sort.sortBy, order: sort.order};
  if (query.trim()) {
    params.name = query.trim();
  }
  if (specialization) {
    params.specialization = specialization;
  }
  if (filters.location.trim()) {
    params.location = filters.location.trim();
  }
  if (filters.minRate) {
    params.minRate = Number(filters.minRate);
  }
  if (filters.maxRate) {
    params.maxRate = Number(filters.maxRate);
  }
  return params;
};
