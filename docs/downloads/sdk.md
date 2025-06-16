# SDK (Software Development Kit)

Integrate Deployio functionality directly into your applications with our comprehensive SDKs. Available for multiple programming languages, our SDKs provide type-safe, well-documented APIs for all Deployio features.

## Overview

The Deployio SDK family provides native integration capabilities for popular programming languages, enabling developers to build custom deployment solutions, automation tools, and integrate deployment functionality into existing applications.

## Available SDKs

### Node.js/JavaScript SDK

```bash
# Installation
npm install @deployio/sdk

# Or with Yarn
yarn add @deployio/sdk
```

#### Basic Usage

```javascript
const { DeployioClient } = require("@deployio/sdk");

// Initialize client
const client = new DeployioClient({
  apiKey: process.env.DEPLOYIO_API_KEY,
  environment: "production", // or 'staging', 'development'
});

// Create a new project
const project = await client.projects.create({
  name: "my-web-app",
  description: "My awesome web application",
  repository: "https://github.com/company/web-app",
});

// Deploy the project
const deployment = await client.deployments.create({
  projectId: project.id,
  branch: "main",
  environment: "production",
});

// Monitor deployment progress
deployment.on("progress", (event) => {
  console.log(`Deployment progress: ${event.percentage}%`);
});

deployment.on("completed", (result) => {
  console.log("Deployment completed:", result.url);
});

deployment.on("failed", (error) => {
  console.error("Deployment failed:", error.message);
});
```

#### Advanced Features

```javascript
// Environment management
await client.environments.setVariable(projectId, "NODE_ENV", "production");
await client.environments.setSecret(projectId, "DATABASE_URL", dbUrl);

// Rollback deployment
await client.deployments.rollback(deploymentId);

// Scale application
await client.applications.scale(projectId, {
  replicas: 5,
  cpu: "500m",
  memory: "1Gi",
});

// Get metrics
const metrics = await client.metrics.get(projectId, {
  timeRange: "24h",
  metrics: ["cpu", "memory", "requests"],
});
```

### Python SDK

```bash
# Installation
pip install deployio-sdk

# Or with Poetry
poetry add deployio-sdk
```

#### Basic Usage

```python
from deployio import DeployioClient
import asyncio

# Initialize client
client = DeployioClient(
    api_key=os.environ['DEPLOYIO_API_KEY'],
    environment='production'
)

async def deploy_application():
    # Create project
    project = await client.projects.create(
        name='my-python-app',
        description='Python web application',
        repository='https://github.com/company/python-app'
    )

    # Deploy project
    deployment = await client.deployments.create(
        project_id=project.id,
        branch='main',
        environment='production'
    )

    # Wait for deployment to complete
    result = await deployment.wait_for_completion(timeout=600)
    print(f"Deployment completed: {result.url}")

# Run deployment
asyncio.run(deploy_application())
```

#### Django Integration

```python
# settings.py
DEPLOYIO_CONFIG = {
    'API_KEY': os.environ.get('DEPLOYIO_API_KEY'),
    'PROJECT_ID': os.environ.get('DEPLOYIO_PROJECT_ID'),
    'ENVIRONMENT': os.environ.get('ENVIRONMENT', 'development')
}

# Deploy management command
# management/commands/deploy.py
from django.core.management.base import BaseCommand
from deployio import DeployioClient
from django.conf import settings

class Command(BaseCommand):
    help = 'Deploy application using Deployio'

    def add_arguments(self, parser):
        parser.add_argument('--env', default='staging')
        parser.add_argument('--branch', default='main')

    def handle(self, *args, **options):
        client = DeployioClient(**settings.DEPLOYIO_CONFIG)

        deployment = client.deployments.create(
            project_id=settings.DEPLOYIO_CONFIG['PROJECT_ID'],
            branch=options['branch'],
            environment=options['env']
        )

        self.stdout.write(f"Deployment started: {deployment.id}")
```

### Go SDK

```bash
# Installation
go get github.com/deployio/deployio-go
```

#### Basic Usage

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"

    "github.com/deployio/deployio-go"
)

func main() {
    // Initialize client
    client := deployio.NewClient(&deployio.Config{
        APIKey:      os.Getenv("DEPLOYIO_API_KEY"),
        Environment: "production",
    })

    ctx := context.Background()

    // Create project
    project, err := client.Projects.Create(ctx, &deployio.ProjectCreateRequest{
        Name:        "go-web-app",
        Description: "Go web application",
        Repository:  "https://github.com/company/go-app",
    })
    if err != nil {
        log.Fatal(err)
    }

    // Deploy project
    deployment, err := client.Deployments.Create(ctx, &deployio.DeploymentCreateRequest{
        ProjectID:   project.ID,
        Branch:      "main",
        Environment: "production",
    })
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Deployment started: %s\n", deployment.ID)

    // Wait for completion
    result, err := client.Deployments.WaitForCompletion(ctx, deployment.ID, 600)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Deployment completed: %s\n", result.URL)
}
```

### Java SDK

```xml
<!-- Maven dependency -->
<dependency>
    <groupId>com.deployio</groupId>
    <artifactId>deployio-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

```gradle
// Gradle dependency
implementation 'com.deployio:deployio-sdk:1.0.0'
```

#### Basic Usage

```java
import com.deployio.DeployioClient;
import com.deployio.models.*;
import java.util.concurrent.CompletableFuture;

public class DeploymentExample {
    public static void main(String[] args) {
        // Initialize client
        DeployioClient client = DeployioClient.builder()
            .apiKey(System.getenv("DEPLOYIO_API_KEY"))
            .environment("production")
            .build();

        // Create project
        ProjectCreateRequest projectRequest = ProjectCreateRequest.builder()
            .name("java-web-app")
            .description("Java web application")
            .repository("https://github.com/company/java-app")
            .build();

        CompletableFuture<Project> projectFuture = client.projects().create(projectRequest);

        projectFuture.thenCompose(project -> {
            // Deploy project
            DeploymentCreateRequest deploymentRequest = DeploymentCreateRequest.builder()
                .projectId(project.getId())
                .branch("main")
                .environment("production")
                .build();

            return client.deployments().create(deploymentRequest);
        }).thenCompose(deployment -> {
            System.out.println("Deployment started: " + deployment.getId());

            // Wait for completion
            return client.deployments().waitForCompletion(deployment.getId(), 600);
        }).thenAccept(result -> {
            System.out.println("Deployment completed: " + result.getUrl());
        }).exceptionally(throwable -> {
            System.err.println("Deployment failed: " + throwable.getMessage());
            return null;
        });
    }
}
```

#### Spring Boot Integration

```java
@Configuration
@EnableConfigurationProperties(DeployioProperties.class)
public class DeployioConfiguration {

    @Bean
    public DeployioClient deployioClient(DeployioProperties properties) {
        return DeployioClient.builder()
            .apiKey(properties.getApiKey())
            .environment(properties.getEnvironment())
            .build();
    }
}

@Service
public class DeploymentService {

    @Autowired
    private DeployioClient deployioClient;

    @Value("${deployio.project-id}")
    private String projectId;

    public CompletableFuture<Deployment> deploy(String branch, String environment) {
        DeploymentCreateRequest request = DeploymentCreateRequest.builder()
            .projectId(projectId)
            .branch(branch)
            .environment(environment)
            .build();

        return deployioClient.deployments().create(request);
    }
}
```

### .NET SDK

```bash
# Package Manager
Install-Package Deployio.SDK

# .NET CLI
dotnet add package Deployio.SDK
```

#### Basic Usage

```csharp
using Deployio.SDK;
using System;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        // Initialize client
        var client = new DeployioClient(new DeployioClientOptions
        {
            ApiKey = Environment.GetEnvironmentVariable("DEPLOYIO_API_KEY"),
            Environment = "production"
        });

        // Create project
        var project = await client.Projects.CreateAsync(new ProjectCreateRequest
        {
            Name = "dotnet-web-app",
            Description = "ASP.NET Core web application",
            Repository = "https://github.com/company/dotnet-app"
        });

        // Deploy project
        var deployment = await client.Deployments.CreateAsync(new DeploymentCreateRequest
        {
            ProjectId = project.Id,
            Branch = "main",
            Environment = "production"
        });

        Console.WriteLine($"Deployment started: {deployment.Id}");

        // Wait for completion
        var result = await client.Deployments.WaitForCompletionAsync(deployment.Id, TimeSpan.FromMinutes(10));
        Console.WriteLine($"Deployment completed: {result.Url}");
    }
}
```

#### ASP.NET Core Integration

```csharp
// Startup.cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddDeployio(Configuration);
    // Other services...
}

// Controllers/DeploymentController.cs
[ApiController]
[Route("api/[controller]")]
public class DeploymentController : ControllerBase
{
    private readonly IDeployioClient _deployioClient;

    public DeploymentController(IDeployioClient deployioClient)
    {
        _deployioClient = deployioClient;
    }

    [HttpPost("deploy")]
    public async Task<IActionResult> Deploy([FromBody] DeployRequest request)
    {
        var deployment = await _deployioClient.Deployments.CreateAsync(new DeploymentCreateRequest
        {
            ProjectId = request.ProjectId,
            Branch = request.Branch,
            Environment = request.Environment
        });

        return Ok(new { deploymentId = deployment.Id });
    }
}
```

### PHP SDK

```bash
# Composer installation
composer require deployio/sdk
```

#### Basic Usage

```php
<?php
require_once 'vendor/autoload.php';

use Deployio\SDK\DeployioClient;
use Deployio\SDK\Models\ProjectCreateRequest;
use Deployio\SDK\Models\DeploymentCreateRequest;

// Initialize client
$client = new DeployioClient([
    'api_key' => $_ENV['DEPLOYIO_API_KEY'],
    'environment' => 'production'
]);

// Create project
$project = $client->projects()->create(new ProjectCreateRequest([
    'name' => 'php-web-app',
    'description' => 'PHP web application',
    'repository' => 'https://github.com/company/php-app'
]));

// Deploy project
$deployment = $client->deployments()->create(new DeploymentCreateRequest([
    'project_id' => $project->id,
    'branch' => 'main',
    'environment' => 'production'
]));

echo "Deployment started: {$deployment->id}\n";

// Wait for completion
$result = $client->deployments()->waitForCompletion($deployment->id, 600);
echo "Deployment completed: {$result->url}\n";
?>
```

#### Laravel Integration

```php
// config/deployio.php
return [
    'api_key' => env('DEPLOYIO_API_KEY'),
    'project_id' => env('DEPLOYIO_PROJECT_ID'),
    'environment' => env('APP_ENV', 'production'),
];

// app/Services/DeploymentService.php
namespace App\Services;

use Deployio\SDK\DeployioClient;
use Deployio\SDK\Models\DeploymentCreateRequest;

class DeploymentService
{
    private $client;

    public function __construct()
    {
        $this->client = new DeployioClient(config('deployio'));
    }

    public function deploy(string $branch, string $environment): array
    {
        $deployment = $this->client->deployments()->create(new DeploymentCreateRequest([
            'project_id' => config('deployio.project_id'),
            'branch' => $branch,
            'environment' => $environment
        ]));

        return [
            'id' => $deployment->id,
            'status' => $deployment->status,
            'url' => $deployment->url
        ];
    }
}

// Artisan command
// app/Console/Commands/DeployCommand.php
use App\Services\DeploymentService;

class DeployCommand extends Command
{
    protected $signature = 'deploy {--branch=main} {--env=staging}';
    protected $description = 'Deploy application using Deployio';

    public function handle(DeploymentService $deploymentService)
    {
        $branch = $this->option('branch');
        $environment = $this->option('env');

        $this->info("Starting deployment...");

        $result = $deploymentService->deploy($branch, $environment);

        $this->info("Deployment started: {$result['id']}");
    }
}
```

### Ruby SDK

```ruby
# Gemfile
gem 'deployio-sdk'

# Installation
bundle install
```

#### Basic Usage

```ruby
require 'deployio'

# Initialize client
client = Deployio::Client.new(
  api_key: ENV['DEPLOYIO_API_KEY'],
  environment: 'production'
)

# Create project
project = client.projects.create(
  name: 'ruby-web-app',
  description: 'Ruby on Rails application',
  repository: 'https://github.com/company/rails-app'
)

# Deploy project
deployment = client.deployments.create(
  project_id: project.id,
  branch: 'main',
  environment: 'production'
)

puts "Deployment started: #{deployment.id}"

# Wait for completion
result = client.deployments.wait_for_completion(deployment.id, timeout: 600)
puts "Deployment completed: #{result.url}"
```

#### Rails Integration

```ruby
# config/initializers/deployio.rb
Deployio.configure do |config|
  config.api_key = Rails.application.credentials.deployio_api_key
  config.project_id = Rails.application.credentials.deployio_project_id
  config.environment = Rails.env
end

# app/services/deployment_service.rb
class DeploymentService
  def self.deploy(branch:, environment:)
    client = Deployio::Client.new

    deployment = client.deployments.create(
      project_id: Deployio.configuration.project_id,
      branch: branch,
      environment: environment
    )

    {
      id: deployment.id,
      status: deployment.status,
      url: deployment.url
    }
  end
end

# Rake task
# lib/tasks/deploy.rake
namespace :deployio do
  desc 'Deploy application'
  task :deploy, [:branch, :environment] => :environment do |task, args|
    branch = args[:branch] || 'main'
    environment = args[:environment] || 'staging'

    puts "Starting deployment..."

    result = DeploymentService.deploy(
      branch: branch,
      environment: environment
    )

    puts "Deployment started: #{result[:id]}"
  end
end
```

## SDK Features

### Authentication

All SDKs support multiple authentication methods:

```javascript
// API Key authentication
const client = new DeployioClient({
  apiKey: "your-api-key",
});

// OAuth 2.0 authentication
const client = new DeployioClient({
  oauth: {
    clientId: "your-client-id",
    clientSecret: "your-client-secret",
    redirectUri: "your-redirect-uri",
  },
});

// JWT token authentication
const client = new DeployioClient({
  token: "your-jwt-token",
});
```

### Error Handling

```javascript
try {
  const deployment = await client.deployments.create(request);
} catch (error) {
  if (error instanceof DeployioError) {
    switch (error.code) {
      case "INSUFFICIENT_PERMISSIONS":
        console.error("Insufficient permissions:", error.message);
        break;
      case "RATE_LIMITED":
        console.error("Rate limited. Retry after:", error.retryAfter);
        break;
      case "RESOURCE_NOT_FOUND":
        console.error("Resource not found:", error.resource);
        break;
      default:
        console.error("Deployment error:", error.message);
    }
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Pagination

```javascript
// Automatic pagination
const projects = await client.projects.list({
  limit: 50,
  sortBy: "created_at",
  sortOrder: "desc",
});

// Manual pagination
let page = 1;
let allProjects = [];

while (true) {
  const response = await client.projects.list({
    page: page,
    limit: 100,
  });

  allProjects.push(...response.data);

  if (!response.hasNextPage) {
    break;
  }

  page++;
}
```

### Webhooks

```javascript
// Webhook verification
const crypto = require("crypto");

function verifyWebhook(payload, signature, secret) {
  const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${computedSignature}`)
  );
}

// Express webhook handler
app.post("/webhooks/deployio", (req, res) => {
  const signature = req.headers["x-deployio-signature"];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhook(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send("Invalid signature");
  }

  const { event, data } = req.body;

  switch (event) {
    case "deployment.completed":
      handleDeploymentCompleted(data);
      break;
    case "deployment.failed":
      handleDeploymentFailed(data);
      break;
    default:
      console.log("Unknown event:", event);
  }

  res.status(200).send("OK");
});
```

## Testing

### Unit Testing

```javascript
// Jest test example
const { DeployioClient } = require("@deployio/sdk");
const { mockDeployioAPI } = require("@deployio/sdk/testing");

describe("Deployment Service", () => {
  beforeEach(() => {
    mockDeployioAPI.reset();
  });

  test("should create deployment successfully", async () => {
    // Mock API response
    mockDeployioAPI.deployments.create.mockResolvedValue({
      id: "dep-123",
      status: "pending",
      url: "https://app.deployio.com/deployments/dep-123",
    });

    const client = new DeployioClient({ apiKey: "test-key" });

    const deployment = await client.deployments.create({
      projectId: "proj-123",
      branch: "main",
      environment: "staging",
    });

    expect(deployment.id).toBe("dep-123");
    expect(deployment.status).toBe("pending");
  });
});
```

### Integration Testing

```javascript
// Integration test with real API
describe("Integration Tests", () => {
  const client = new DeployioClient({
    apiKey: process.env.DEPLOYIO_TEST_API_KEY,
    baseUrl: "https://api-staging.deployio.com",
  });

  test("should complete full deployment lifecycle", async () => {
    // Create test project
    const project = await client.projects.create({
      name: "integration-test-app",
      repository: "https://github.com/deployio/test-app",
    });

    // Deploy project
    const deployment = await client.deployments.create({
      projectId: project.id,
      branch: "main",
      environment: "test",
    });

    // Wait for completion
    const result = await client.deployments.waitForCompletion(
      deployment.id,
      300 // 5 minutes timeout
    );

    expect(result.status).toBe("completed");
    expect(result.url).toMatch(/^https:\/\//);

    // Cleanup
    await client.projects.delete(project.id);
  }, 300000); // 5 minute timeout
});
```

## Best Practices

### Performance

1. **Connection Pooling**: Reuse client instances
2. **Batch Operations**: Use batch APIs when available
3. **Caching**: Cache frequently accessed data
4. **Pagination**: Use appropriate page sizes
5. **Timeouts**: Set reasonable timeouts for operations

### Security

1. **API Key Management**: Store API keys securely
2. **Token Rotation**: Implement token rotation
3. **Input Validation**: Validate all inputs
4. **Error Handling**: Don't expose sensitive information
5. **HTTPS Only**: Always use HTTPS in production

### Error Handling

1. **Graceful Degradation**: Handle API failures gracefully
2. **Retry Logic**: Implement exponential backoff
3. **Logging**: Log errors for debugging
4. **User Feedback**: Provide meaningful error messages
5. **Monitoring**: Monitor API usage and errors

## Support and Resources

- **Documentation**: [sdk.deployio.com](https://sdk.deployio.com)
- **API Reference**: [api.deployio.com](https://api.deployio.com)
- **GitHub**: Language-specific repositories
- **Examples**: [github.com/deployio/examples](https://github.com/deployio/examples)
- **Discord**: Developer community support
- **Support**: sdk-support@deployio.com

## Next Steps

- [Explore CLI Tool](./cli-tool.md)
- [Download Desktop App](./desktop-app.md)
- [Learn about API Authentication](../api/authentication.md)
- [Set up CI/CD integration](../guides/ci-cd-workflows.md)

Build powerful deployment automation with Deployio SDKs! 🚀
