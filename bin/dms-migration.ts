#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DmsMigrationStack } from '../lib/dms-migration-stack';

const app = new cdk.App();
const accountId = process.env.CDK_DEFAULT_ACCOUNT;

new DmsMigrationStack(app, 'DmsMigrationApSoutheast1Stack',{
    env: {
        account: accountId,
        region: 'ap-southeast-1',
    },
    cidr: '10.0.0.0/16',
});
new DmsMigrationStack(app, 'DmsMigrationApSoutheast2Stack',{
    env: {
        account: accountId,
        region: 'ap-southeast-2',
    },
    cidr: '10.1.0.0/16'
});
