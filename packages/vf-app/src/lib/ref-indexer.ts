import db from '@/lib/ref-database';

interface PoolView {
  id: number;
  token_account_ids: string[];
  amounts: string[];
  total_fee: number;
  shares_total_supply: string;
  tvl: string;
  token0_ref_price: string;
  pool_kind?: string;
}

interface Pool {
  id: number;
  tokenIds: string[];
  supplies: Record<string, string>;
  fee: number;
  shareSupply: string;
  tvl: string;
  token0_ref_price: string;
  pool_kind?: string;
  Dex?: string;
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

interface DbTopPool {
  id: string;
  token_account_ids: string[];
  amounts: string[];
  total_fee: number;
  shares_total_supply: string;
  tvl: string;
  token0_ref_price: string;
  pool_kind?: string;
}

const config = {
  indexerUrl: 'https://indexer.ref.finance',
  dataServiceApiUrl: 'https://api.ref.finance',
  sodakiApiUrl: 'https://api.stats.ref.finance',
};

export const getTopPoolsIndexerRaw = async (): Promise<PoolView[]> => {
  const timeoutDuration = 20000; // 20 seconds
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutDuration);

  try {
    const response = await fetch(config.indexerUrl + '/list-top-pools', {
      method: 'GET',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json() as PoolView[];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    } else {
      throw error;
    }
  }
};

export const getTokenPriceList = async (): Promise<Record<string, { price: string; symbol?: string; decimal?: number }>> => {
  const res = await fetch(config.indexerUrl + '/list-token-price', {
    method: 'GET',
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  });
  const list = await res.json() as Record<string, { price: string; symbol?: string; decimal?: number }>;
  return list;
};

export const getPoolsByTokensIndexer = async ({
  token0,
  token1,
}: {
  token0: string;
  token1: string;
}): Promise<PoolView[]> => {
  const res1 = await fetch(
    config.indexerUrl +
      `/list-pools-by-tokens?token0=${token0}&token1=${token1}`,
    {
      method: 'GET',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    }
  ).then((res) => res.json() as Promise<{ code: number; data: PoolView[] | null }>);

  if (res1?.code === -1 && res1?.data === null) return [];

  return res1.data?.filter(
    (p) => !p.id?.toString().includes('STABLE') && p.token_account_ids.length < 3
  ) ?? [];
};

export const getTopPools = async (): Promise<Pool[]> => {
  try {
    let pools: PoolView[];

    if (await db.checkTopPools()) {
      pools = (await db.queryTopPools()).map((p: DbTopPool) => ({
        id: Number(p.id),
        token_account_ids: p.token_account_ids,
        amounts: p.amounts,
        total_fee: p.total_fee,
        shares_total_supply: p.shares_total_supply,
        tvl: p.tvl,
        token0_ref_price: p.token0_ref_price,
        pool_kind: p.pool_kind,
      }));
    } else {
      pools = await fetch(config.indexerUrl + '/list-top-pools', {
        method: 'GET',
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
      }).then((res) => res.json() as Promise<PoolView[]>);

      await db.cacheTopPools(pools);
    }

    const parsedPools = pools.map((pool) => parsePool(pool));

    return parsedPools
      .filter((pool) => {
        return !pool.id?.toString().includes('STABLE') && pool.tokenIds.length < 3;
      });
  } catch (_error) {
    return [];
  }
};


export const getTotalPools = async (): Promise<number> => {
  const response = await fetch('https://rpc.mainnet.fastnear.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method: 'query',
      params: {
        request_type: 'call_function',
        account_id: 'v2.ref-finance.near',
        method_name: 'get_number_of_pools',
        args_base64: Buffer.from('{}').toString('base64'),
        finality: 'final'
      }
    })
  });

  if (!response.ok) throw new Error('Failed to get total pools');

  const data = await response.json() as { result: { result: Uint8Array } };
  return JSON.parse(Buffer.from(data.result.result).toString()) as number;
};

export const getAllPools = async (
  page = 1,
  perPage = 500
): Promise<Pool[]> => {
  const index = (page - 1) * perPage;

  const response = await fetch('https://rpc.mainnet.fastnear.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method: 'query',
      params: {
        request_type: 'call_function',
        account_id: 'v2.ref-finance.near',
        method_name: 'get_pools',
        args_base64: Buffer.from(JSON.stringify({ from_index: index, limit: perPage })).toString('base64'),
        finality: 'final'
      }
    })
  });

  if (!response.ok) throw new Error('Failed to get pools');

  const data = await response.json() as { result: { result: Uint8Array } };
  const poolData = JSON.parse(Buffer.from(data.result.result).toString()) as PoolView[];

  return poolData.map((rawPool, i) => parsePool(rawPool, i + index));
};

const parsePool = (pool: PoolView, id?: number): Pool => ({
  id: Number(id ?? pool.id),
  tokenIds: pool.token_account_ids,
  supplies: pool.amounts.reduce(
    (acc: Record<string, string>, amount: string, i: number) => {
      acc[pool.token_account_ids[i]] = amount;
      return acc;
    },
    {}
  ),
  fee: pool.total_fee,
  shareSupply: pool.shares_total_supply,
  tvl: pool.tvl,
  token0_ref_price: pool.token0_ref_price,
  pool_kind: pool?.pool_kind,
});

const fetchPoolsRPC = async (): Promise<Pool[]> => {
  const totalPools = await getTotalPools();
  const pages = Math.ceil(totalPools / 500);

  const res = (
    await Promise.all([...Array(pages)].map((_, i) => getAllPools(i + 1)))
  )
    .flat()
    .map((p) => ({ ...p, Dex: 'ref' }));

  return res;
};

export const getPoolsByTokens = async ({
  tokenInId,
  tokenOutId,
}: {
  tokenInId: string;
  tokenOutId: string;
}): Promise<{
  filteredPools: Pool[];
  pool_protocol: string;
}> => {
  let pools: readonly Pool[];
  let pool_protocol = 'indexer';

  const cachePools = async (pools: readonly Pool[]) => {
    const filteredPools = pools.filter((p) => !p.id?.toString().includes('STABLE'));
    await db.cachePoolsByTokens(filteredPools as PoolData[]);
  };

  // Try indexer first
  try {
    const result = await fetchTopPools();
    const protocol = result.protocol;
    pool_protocol = protocol;

    if (protocol === 'indexer') {
      const poolsArray: PoolView[] = result.pools as PoolView[];
       
      await db.cacheTopPools(poolsArray);
      pools = poolsArray.map((p) => {
        return {
          ...parsePool(p),
          Dex: 'ref',
        };
      });
    } else {
      pools = result.pools as Pool[];
    }

    await cachePools(pools);
  } catch (_error) {
    // Fallback to RPC
    pool_protocol = 'rpc';
    pools = await fetchPoolsRPC();
    await cachePools(pools);
  }

  const filteredPools = pools
    .filter((pool) => {
      return (
        pool.tokenIds.includes(tokenInId) &&
        pool.tokenIds.includes(tokenOutId) &&
        !pool.id?.toString().includes('STABLE')
      );
    });

  return { filteredPools, pool_protocol };
};

const fetchTopPools = async (): Promise<{ pools: PoolView[] | Pool[]; protocol: string }> => {
  try {
    return {
      pools: await getTopPoolsIndexerRaw(),
      protocol: 'indexer',
    };
  } catch (_error) {
    console.warn('[Indexer] Failed, falling back to RPC');

    await db.topPools.clear();
    await db.poolsTokens.clear();

    const res = await fetchPoolsRPC();

    return {
      pools: res,
      protocol: 'rpc',
    };
  }
};