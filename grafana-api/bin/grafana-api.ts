#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GrafanaApiStack } from '../lib/grafana-api-stack';

const app = new cdk.App();
new GrafanaApiStack(app, 'GrafanaApiStack');
