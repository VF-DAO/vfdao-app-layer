export interface CoreSetTransactionParams {
  receiverId: string;
  actions: {
    type: 'FunctionCall';
    params: {
      methodName: string;
      args: Record<string, unknown>;
      gas: string;
      deposit: string;
    };
  }[];
}

const PROFILE_DEPOSIT = '50000000000000000000000';
const DELETE_DEPOSIT = '1';

export function buildCoreSetTransaction(
  coreContract: string,
  data: Record<string, string | null>
): CoreSetTransactionParams {
  const deleting = Object.values(data).every((value) => value === null);
  return {
    receiverId: coreContract,
    actions: [
      {
        type: 'FunctionCall',
        params: {
          methodName: 'set',
          args: { data },
          gas: '100000000000000',
          deposit: deleting ? DELETE_DEPOSIT : PROFILE_DEPOSIT,
        },
      },
    ],
  };
}
