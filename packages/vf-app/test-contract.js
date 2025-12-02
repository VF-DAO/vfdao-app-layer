async function checkContractMethods() {
  const rpcUrl = 'https://rpc.mainnet.near.org';

  try {
    console.log('Checking available methods on dclv2.ref-labs.near...');

    // Try some common method names
    const methods = ['get_return', 'get_return_amount', 'estimate_return', 'swap', 'get_pools'];

    for (const method of methods) {
      console.log('Testing method:', method);
      try {
        const testResponse = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: '2',
            method: 'query',
            params: {
              request_type: 'call_function',
              account_id: 'dclv2.ref-labs.near',
              method_name: method,
              args_base64: Buffer.from('{}').toString('base64'),
              finality: 'final'
            }
          })
        });

        const testData = await testResponse.json();
        if (testData.result && !testData.result.error) {
          console.log('Method', method, 'exists!');
          break;
        }
        if (testData.result && testData.result.error) {
          console.log('Method', method, ':', testData.result.error);
        }
      } catch (err) {
        console.log('Method', method, 'test failed:', err.message);
      }
    }

  } catch (err) {
    console.error('Check failed:', err.message);
  }
}

checkContractMethods();