const { DynamoDBClient, CreateTableCommand, ResourceInUseException } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'local',
  credentials: {
    accessKeyId: 'fake',
    secretAccessKey: 'fake'
  }
});

const docClient = DynamoDBDocumentClient.from(ddbClient);

const seedRecruiter = async () => {
  try {
    // 1. Ensure Recruiters table exists
    const createTableParams = {
      TableName: 'Recruiters',
      AttributeDefinitions: [{ AttributeName: 'username', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'username', KeyType: 'HASH' }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    };

    try {
      await ddbClient.send(new CreateTableCommand(createTableParams));
      console.log("Created 'Recruiters' table.");
    } catch (err) {
      if (err instanceof ResourceInUseException || err.name === 'ResourceInUseException') {
        console.log("'Recruiters' table already exists.");
      } else {
        throw err;
      }
    }

    // 2. Insert recruiter item
    const email = 'suchith25204@gmail.com';
    await docClient.send(new PutCommand({
      TableName: 'Recruiters',
      Item: {
        username: email,
        role: 'Admin',
        name: 'Suchith',
        createdAt: new Date().toISOString()
      }
    }));

    console.log(`Successfully seeded recruiter: ${email}`);
  } catch (err) {
    console.error("Error seeding recruiter:", err);
  }
};

seedRecruiter();
