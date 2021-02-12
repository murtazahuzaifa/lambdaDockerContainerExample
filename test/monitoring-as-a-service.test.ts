import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as MonitoringAsAService from '../lib/monitoring-as-a-service-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new MonitoringAsAService.MonitoringAsAServiceStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
