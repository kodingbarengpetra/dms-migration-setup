#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DmsMigrationStack } from '../lib/dms-migration-stack';

const app = new cdk.App();
new DmsMigrationStack(app, 'DmsMigrationStack');
