/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'comfrt-serverless',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
    };
  },
  async run() {
    await import('./infra/secrets');
    const { tagVipsFunction } = await import('./infra/api');

    return {
      tagVipsFunction: tagVipsFunction.url,
    };
  },
});
