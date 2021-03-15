# AWS Database Migration Service Inter-region Demo Environment Setup

This CDK provides set up for demo of inter-region RDS migration by using AWS 
Database Migration Service.

## Architecture


## Running

To run the CDK script first set environment variable `CDK_DEFAULT_ACCOUNT` with 
your account ID, or you can set the value of variable `accountId` in
`bin/dms-migration.ts` source.

To execute the script, run.

```
cdk deploy --all
```
