import * as cdk from '@aws-cdk/core';
import * as rds from '@aws-cdk/aws-rds';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as assets from '@aws-cdk/aws-s3-assets';
import * as path from 'path';

export interface DmsMigrationStackProps extends cdk.StackProps {
  cidr: string,
  populate: boolean,
}

export class DmsMigrationStack extends cdk.Stack {
  private props: DmsMigrationStackProps;
  private vpc: ec2.IVpc;
  private bastion: ec2.BastionHostLinux;
  private database: rds.DatabaseInstance;
  private asset: assets.Asset;
  
  constructor(scope: cdk.Construct, id: string, props: DmsMigrationStackProps) {
    
    super(scope, id, props);
    this.props = props;
    
    this.createVpc();
    this.createAsset();
    this.createDatabase();
    this.createBastionHost();
    this.setPermission();
    this.setupEnvironments();
  }
  
  private createVpc() {
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      cidr: this.props.cidr,
      //simplify by not using all AZ and not using NAT gateway
      maxAzs: 2,
      natGateways: 0,
    });
    new cdk.CfnOutput(this, 'VPC ID', { value: this.vpc.vpcId });
  }
  
  private createAsset() {
    this.asset = new assets.Asset(this, 'Asset', {
        path: path.join(__dirname, '../data'),
    });
  }
  
  /**
   * Enable us to connect to the database via bastion host.
   */
  private createBastionHost() {
    this.bastion = new ec2.BastionHostLinux(this, 'BastionInstance', {
      vpc: this.vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC
      }
    });
    //Allow connection through Instance Connect, without keypair.
    this.bastion.allowSshAccessFrom(ec2.Peer.anyIpv4());
    new cdk.CfnOutput(this, 'Bastion Host', { value: this.bastion.instancePrivateDnsName });
  }
  
  private createDatabase() {
    this.database = new rds.DatabaseInstance(this, 'DatabaseInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0_11 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      allocatedStorage: 8, //8GB
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.ISOLATED
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, //don't save snapshot since this is demo
    });
    new cdk.CfnOutput(this, 'Secret ID', { value: this.database.secret!.secretName });
    new cdk.CfnOutput(this, 'RDS Endpoint', { value: this.database.dbInstanceEndpointAddress });
  }
  
  private setPermission() {
    this.database.secret!.grantRead(this.bastion.role);
    this.asset.grantRead(this.bastion.role);
    
    //Allow MySQL connection from bastion host.
    const securityGroup = this.bastion.connections.securityGroups[0];
    this.database.connections.allowFrom(securityGroup, ec2.Port.tcp(3306), 'MySQL');
    new cdk.CfnOutput(this, 'Bastion Security Group ID', { value: securityGroup.securityGroupId });
  }
  
  private setupEnvironments() {
    const secretId = this.database.secret!.secretName;
    const s3Object = this.asset.s3ObjectUrl;
    const region = cdk.Stack.of(this).region;
    const populate = this.props.populate ? "TRUE": "";
    
    let userData = `
#!/bin/bash
# Variables
DMS_DATA=${s3Object}

# Install script
aws s3 cp $DMS_DATA /home/ec2-user/scripts.zip
unzip -o /home/ec2-user/scripts.zip -d /home/ec2-user/

DMS_DATA=$DMS_DATA REGION=${region} POPULATE=${populate} DATABASE_SECRET_NAME=${secretId} \
  sh /home/ec2-user/init.sh >> /var/log/dms-migration-stack.log 2>&1
`;

    this.bastion.instance.addUserData(userData);
  }
}
