const { DynamoDBClient, CreateTableCommand, ResourceInUseException } = require('@aws-sdk/client-dynamodb');

const ddbClient = new DynamoDBClient({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
});

const initializeFloci = async () => {
  console.log("Initializing Floci DynamoDB tables...");

  // 1. Candidates Table
  try {
    const params = {
      TableName: 'Candidates',
      AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    };
    await ddbClient.send(new CreateTableCommand(params));
    console.log("✅ DynamoDB Table 'Candidates' created.");
  } catch (error) {
    if (error instanceof ResourceInUseException || error.name === 'ResourceInUseException') {
      console.log("ℹ️ DynamoDB Table 'Candidates' already exists.");
    } else {
      console.error("❌ Error creating table Candidates:", error);
    }
  }

  // 2. Roles Table
  try {
    const rolesParams = {
      TableName: 'Roles',
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    };
    await ddbClient.send(new CreateTableCommand(rolesParams));
    console.log("✅ DynamoDB Table 'Roles' created.");
  } catch (error) {
    if (error instanceof ResourceInUseException || error.name === 'ResourceInUseException') {
      console.log("ℹ️ DynamoDB Table 'Roles' already exists.");
    } else {
      console.error("❌ Error creating table Roles:", error);
    }
  }

  // 3. Recruiters Table
  try {
    const recruitersParams = {
      TableName: 'Recruiters',
      AttributeDefinitions: [{ AttributeName: 'username', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'username', KeyType: 'HASH' }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    };
    await ddbClient.send(new CreateTableCommand(recruitersParams));
    console.log("✅ DynamoDB Table 'Recruiters' created.");
  } catch (error) {
    if (error instanceof ResourceInUseException || error.name === 'ResourceInUseException') {
      console.log("ℹ️ DynamoDB Table 'Recruiters' already exists.");
    } else {
      console.error("❌ Error creating table Recruiters:", error);
    }
  }
};

initializeFloci();
