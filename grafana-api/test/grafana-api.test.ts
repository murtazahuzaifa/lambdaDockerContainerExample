import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as GrafanaApi from '../lib/grafana-api-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new GrafanaApi.GrafanaApiStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
