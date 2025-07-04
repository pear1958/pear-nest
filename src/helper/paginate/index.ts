import {
  FindManyOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder
} from 'typeorm'
import { IPaginationOptions, PaginationTypeEnum } from './type'
import { Pagination } from './pagination'
import { createPaginationObject } from './create-pagination'

const DEFAULT_LIMIT = 10
const DEFAULT_PAGE = 1

function resolveOptions(options: IPaginationOptions): [number, number, PaginationTypeEnum] {
  return [
    options.page || DEFAULT_PAGE,
    options.pageSize || DEFAULT_LIMIT,
    options.paginationType || PaginationTypeEnum.TAKE_AND_SKIP
  ]
}

/**
 * 用法: return paginate(this.roleRepository, { page, pageSize })
 */
async function paginateRepository<T>(
  repository: Repository<T>,
  options: IPaginationOptions,
  searchOptions?: FindOptionsWhere<T> | FindManyOptions<T>
): Promise<Pagination<T>> {
  const [page, limit] = resolveOptions(options)

  const promises: [Promise<T[]>, Promise<number> | undefined] = [
    repository.find({
      skip: limit * (page - 1),
      take: limit,
      ...searchOptions
    }),
    repository.count(searchOptions)
  ]

  const [items, total] = await Promise.all(promises)

  return createPaginationObject<T>({
    items,
    totalItems: total,
    currentPage: page,
    limit
  })
}

/**
 * 用法: return paginate(queryBuilder, { page, pageSize })
 */
async function paginateQueryBuilder<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions
): Promise<Pagination<T>> {
  const [page, limit, paginationType] = resolveOptions(options)
  if (paginationType === PaginationTypeEnum.TAKE_AND_SKIP) {
    queryBuilder.take(limit).skip((page - 1) * limit)
  } else {
    queryBuilder.limit(limit).offset((page - 1) * limit)
  }

  const [items, total] = await queryBuilder.getManyAndCount()

  return createPaginationObject<T>({
    items,
    totalItems: total,
    currentPage: page,
    limit
  })
}

export async function paginate<T extends ObjectLiteral>(
  repositoryOrQueryBuilder: Repository<T> | SelectQueryBuilder<T>,
  options: IPaginationOptions,
  searchOptions?: FindOptionsWhere<T> | FindManyOptions<T>
) {
  return repositoryOrQueryBuilder instanceof Repository
    ? paginateRepository<T>(repositoryOrQueryBuilder, options, searchOptions)
    : paginateQueryBuilder<T>(repositoryOrQueryBuilder, options)
}

// ----------------------------------------------

export async function paginateRaw<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions
): Promise<Pagination<T>> {
  const [page, limit, paginationType] = resolveOptions(options)

  const promises: [Promise<T[]>, Promise<number> | undefined] = [
    (paginationType === PaginationTypeEnum.LIMIT_AND_OFFSET
      ? queryBuilder.limit(limit).offset((page - 1) * limit)
      : queryBuilder.take(limit).skip((page - 1) * limit)
    ).getRawMany<T>(),
    queryBuilder.getCount()
  ]

  const [items, total] = await Promise.all(promises)

  return createPaginationObject<T>({
    items,
    totalItems: total,
    currentPage: page,
    limit
  })
}

export async function paginateRawAndEntities<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions
): Promise<[Pagination<T>, Partial<T>[]]> {
  const [page, limit, paginationType] = resolveOptions(options)

  const promises: [Promise<{ entities: T[]; raw: T[] }>, Promise<number> | undefined] = [
    (paginationType === PaginationTypeEnum.LIMIT_AND_OFFSET
      ? queryBuilder.limit(limit).offset((page - 1) * limit)
      : queryBuilder.take(limit).skip((page - 1) * limit)
    ).getRawAndEntities<T>(),
    queryBuilder.getCount()
  ]

  const [itemObject, total] = await Promise.all(promises)

  return [
    createPaginationObject<T>({
      items: itemObject.entities,
      totalItems: total,
      currentPage: page,
      limit
    }),
    itemObject.raw
  ]
}
