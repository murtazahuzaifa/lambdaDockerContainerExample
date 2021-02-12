#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MonitoringAsAServiceStack } from '../lib/monitoring-as-a-service-stack';

const app = new cdk.App();
new MonitoringAsAServiceStack(app, 'MonitoringAsAServiceStack');
