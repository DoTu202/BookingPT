const User = require('../models/userModel');
const PTProfile = require('../models/PTProfileModel');
const Availability = require('../models/AvailabilityModel');
const {dayRange, escapeRegex} = require('../utils/helpers');
const {badRequest} = require('../utils/httpError');

// Public PT fields. Email, phone number and date of birth are personal data
// and are not exposed to other users.
const PUBLIC_PT_USER_FIELDS = 'username photoUrl role';

const SORTS = {
  hourlyRate: order => ({hourlyRate: order}),
  experienceYears: order => ({experienceYears: order}),
};
const DEFAULT_SORT = {rating: -1, numReviews: -1};

const emptyResult = page => ({profiles: [], page, pages: 0, count: 0});

// Profile-level conditions (specialization, location, price range).
const buildProfileConditions = ({specialization, location, minRate, maxRate}) => {
  const conditions = {isAcceptingClients: true};

  if (specialization) {
    conditions.specializations = {$regex: escapeRegex(specialization), $options: 'i'};
  }
  if (location) {
    // location is a sub-document, so match against its string fields.
    const locationRegex = {$regex: escapeRegex(location), $options: 'i'};
    conditions.$or = [{'location.city': locationRegex}, {'location.district': locationRegex}];
  }

  const min = parseFloat(minRate);
  const max = parseFloat(maxRate);
  if (!Number.isNaN(min) || !Number.isNaN(max)) {
    conditions.hourlyRate = {};
    if (!Number.isNaN(min)) {
      conditions.hourlyRate.$gte = min;
    }
    if (!Number.isNaN(max)) {
      conditions.hourlyRate.$lte = max;
    }
  }
  return conditions;
};

// Ids of PTs with an open slot on the given (Vietnam) day.
const ptIdsAvailableOn = async availableDate => {
  const range = dayRange(availableDate);
  if (!range) {
    throw badRequest('availableDate is not a valid date.');
  }
  return Availability.find({
    status: 'available',
    startTime: {$lte: range.end, $gte: new Date()},
    endTime: {$gte: range.start},
  }).distinct('pt');
};

const intersectIds = lists =>
  lists.reduce((acc, list) => {
    const set = new Set(list.map(id => id.toString()));
    return acc.filter(id => set.has(id.toString()));
  });

// Returns {profiles, page, pages, count}.
const searchPTs = async (query, {page, size, skip}) => {
  const {name, availableDate, sortBy} = query;
  const order = query.order === 'desc' ? -1 : 1;
  const conditions = buildProfileConditions(query);

  const userIdFilters = [];

  if (name) {
    const idsByName = await User.find({
      role: 'pt',
      isActive: true,
      username: {$regex: escapeRegex(name), $options: 'i'},
    }).distinct('_id');
    if (idsByName.length === 0) {
      return emptyResult(page);
    }
    userIdFilters.push(idsByName);
  }

  if (availableDate) {
    const availablePTs = await ptIdsAvailableOn(availableDate);
    if (availablePTs.length === 0) {
      return emptyResult(page);
    }
    userIdFilters.push(availablePTs);
  }

  // Deactivated trainers never show up, whatever the other filters are.
  const inactivePtIds = await User.find({role: 'pt', isActive: false}).distinct('_id');
  if (inactivePtIds.length > 0) {
    conditions.user = {$nin: inactivePtIds};
  }

  if (userIdFilters.length > 0) {
    const userIds = intersectIds(userIdFilters);
    if (userIds.length === 0) {
      return emptyResult(page);
    }
    conditions.user = {...conditions.user, $in: userIds};
  }

  const count = await PTProfile.countDocuments(conditions);
  if (count === 0) {
    return emptyResult(page);
  }

  const sort = SORTS[sortBy] ? SORTS[sortBy](order) : DEFAULT_SORT;
  const profiles = await PTProfile.find(conditions)
    .populate('user', PUBLIC_PT_USER_FIELDS)
    .sort({...sort, _id: 1}) // _id keeps pagination stable
    .skip(skip)
    .limit(size);

  return {profiles, page, pages: Math.ceil(count / size), count};
};

module.exports = {PUBLIC_PT_USER_FIELDS, searchPTs};
