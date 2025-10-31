import Dexie, { type Table } from 'dexie';
import moment from 'moment';

interface PoolsTokens {
  id: number;
  pool_id: string;
  token1Id: string;
  token2Id: string;
  token1Supply: string;
  token2Supply: string;
  fee: number;
  shares: string;
  update_time: string;
  token0_price: string;
  Dex?: string;
}

interface TopPool {
  id: string;
  amounts: string[];
  amp: number;
  farming: boolean;
  pool_kind: string;
  shares_total_supply: string;
  token0_ref_price: string;
  token_account_ids: string[];
  token_symbols: string[];
  total_fee: number;
  tvl: string;
  update_time: number;
}

interface TokenPrice {
  id?: string;
  decimal: number;
  price: string;
  symbol: string;
  update_time?: number;
}

interface PoolData {
  id: number;
  tokenIds: string[];
  supplies: Record<string, string>;
  fee: number;
  shareSupply: string;
  token0_ref_price: string;
  Dex: string;
}

interface TopPoolData {
  id: number | string;
  amounts?: string[];
  amp?: number;
  farming?: boolean;
  pool_kind?: string;
  shares_total_supply?: string;
  token0_ref_price?: string;
  token_account_ids?: string[];
  token_symbols?: string[];
  total_fee?: number;
  tvl?: string;
}

class RefDatabase extends Dexie {
  public poolsTokens!: Table<PoolsTokens>;
  public topPools!: Table<TopPool>;
  public tokenPrices!: Table<TokenPrice>;

  public constructor() {
    super('RefDatabase');

    this.version(1).stores({
      pools_tokens:
        'id, token1Id, token2Id, token1Supply, token2Supply, fee, shares, update_time, token0_price',
      topPools: 'id, pool_kind, update_time',
      tokenPrices: 'id, symbol, update_time',
    });

    this.poolsTokens = this.table('pools_tokens');
    this.topPools = this.table('topPools');
    this.tokenPrices = this.table('tokenPrices');
  }

  public async cachePoolsByTokens(pools: PoolData[]) {
    await this.poolsTokens.clear();
    const filtered_pools = pools.filter((pool: PoolData) => pool.tokenIds.length < 3);
    await this.poolsTokens.bulkPut(
      filtered_pools.map(
        (pool: PoolData) => ({
          id: pool.id,
          pool_id: pool.id.toString(),
          token1Id: pool.tokenIds[0],
          token2Id: pool.tokenIds[1],
          token1Supply: pool.supplies[pool.tokenIds[0]],
          token2Supply: pool.supplies[pool.tokenIds[1]],
          fee: pool.fee,
          shares: pool.shareSupply,
          update_time: moment().unix().toString(),
          token0_price: pool.token0_ref_price || '0',
          Dex: pool.Dex,
        })
      )
    );
  }

  public async cacheTopPools(pools: TopPoolData[]) {
    await this.topPools.clear();
    await this.topPools.bulkPut(
      pools.map((topPool: TopPoolData): TopPool => ({
        id: topPool.id.toString(),
        amounts: topPool.amounts ?? [],
        amp: topPool.amp ?? 0,
        farming: topPool.farming ?? false,
        pool_kind: topPool.pool_kind ?? '',
        shares_total_supply: topPool.shares_total_supply ?? '0',
        token0_ref_price: topPool.token0_ref_price ?? '0',
        token_account_ids: topPool.token_account_ids ?? [],
        token_symbols: topPool.token_symbols ?? [],
        total_fee: topPool.total_fee ?? 0,
        tvl: topPool.tvl ?? '0',
        update_time: moment().unix(),
      }))
    );
  }

  public async checkTopPools() {
    const pools = await this.topPools.limit(10).toArray();
    return (
      pools.length > 0 &&
      pools.every(
        (pool: TopPool) =>
          Number(pool.update_time) >=
          Number(moment().unix()) - 300 // 5 minutes
      )
    );
  }

  public async checkPoolsTokens() {
    const items = await this.poolsTokens.limit(10).toArray();
    return (
      items.length > 0 &&
      items.every(
        (item: PoolsTokens) =>
          Number(item.update_time) >=
          Number(moment().unix()) - 300 // 5 minutes
      )
    );
  }

  public async queryTopPools() {
    const pools = await this.topPools.toArray();
    return pools.map((pool: TopPool) => {
      const { update_time: _update_time, ...poolInfo } = pool;
      return poolInfo;
    });
  }

  public async getPoolsByTokens(
    tokenInId: string,
    tokenOutId: string
  ) {
    const normalItems = await this.poolsTokens
      .where('token1Id')
      .equals(tokenInId.toString())
      .and((item: PoolsTokens) => item.token2Id === tokenOutId.toString())
      .toArray();
    const reverseItems = await this.poolsTokens
      .where('token1Id')
      .equals(tokenOutId.toString())
      .and((item: PoolsTokens) => item.token2Id === tokenInId.toString())
      .toArray();

    return [...normalItems, ...reverseItems].map((item: PoolsTokens) => ({
      id: item.id,
      fee: item.fee,
      tokenIds: [item.token1Id, item.token2Id],
      supplies: {
        [item.token1Id]: item.token1Supply,
        [item.token2Id]: item.token2Supply,
      },
      token0_ref_price: item.token0_price,
      Dex: item.Dex,
    }));
  }

  public async queryTokenPrices() {
    return this.tokenPrices.toArray();
  }

  public async checkTokenPrices() {
    const priceList = await this.tokenPrices.limit(2).toArray();
    return (
      priceList.length > 0 &&
      priceList.every(
        (price: TokenPrice) =>
          Number(price.update_time) >=
          Number(moment().unix()) - 300 // 5 minutes
      )
    );
  }

  public async cacheTokenPrices(tokenPriceMap: Record<string, TokenPrice>) {
    const cacheData: TokenPrice[] = [];
    const tokenIds = Object.keys(tokenPriceMap);
    tokenIds.forEach((tokenId: string) => {
      cacheData.push({
        ...tokenPriceMap[tokenId],
        id: tokenId,
        update_time: moment().unix(),
      });
    });
    await this.tokenPrices.bulkPut(cacheData);
  }

  public async clearCache() {
    await this.poolsTokens.clear();
    await this.topPools.clear();
    await this.tokenPrices.clear();
  }
}

export default new RefDatabase();