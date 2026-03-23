function createQueryBuilder({
  firstResult,
  updateResult,
  deleteResult,
  sumResult,
} = {}) {
  return {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockResolvedValue(updateResult || []),
    del: jest.fn().mockResolvedValue(deleteResult || 0),
    returning: jest.fn().mockResolvedValue(updateResult || []),
    first: jest.fn().mockResolvedValue(firstResult),
    sum: jest.fn().mockReturnThis(),
  };
}

function createKnexMock(config = {}) {
  const builder = createQueryBuilder(config);

  const knex = jest.fn(() => builder);
  knex.fn = {
    now: jest.fn(() => 'mocked-now'),
  };

  knex._builder = builder;

  return knex;
}

module.exports = {
  createKnexMock,
};
