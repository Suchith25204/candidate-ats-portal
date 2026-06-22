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

// Allow passing an email as an argument, fallback to default
const targetEmail = process.argv[2] || 'suchith25204@gmail.com';

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

    // 2. Insert recruiter item as an Admin
    await docClient.send(new PutCommand({
      TableName: 'Recruiters',
      Item: {
        username: targetEmail,
        role: 'Admin',
        name: targetEmail.split('@')[0], // Extract name from email
        createdAt: new Date().toISOString()
      }
    }));

    console.log(`Successfully seeded Admin recruiter: ${targetEmail}`);
  } catch (err) {
    console.error("Error seeding recruiter:", err);
  }
};

seedRecruiter();
