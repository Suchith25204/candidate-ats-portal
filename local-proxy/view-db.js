const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: "local",
  endpoint: "http://localhost:8000",
  credentials: { accessKeyId: "fake", secretAccessKey: "fake" },
});

const docClient = DynamoDBDocumentClient.from(client);

async function viewDatabase() {
  try {
    const command = new ScanCommand({ TableName: "Candidates" });
    const response = await docClient.send(command);
    
    console.log(`Found ${response.Count} items in the database:`);
    console.dir(response.Items, { depth: null, colors: true });
  } catch (error) {
    console.error("Error reading database:", error);
  }
}

viewDatabase();