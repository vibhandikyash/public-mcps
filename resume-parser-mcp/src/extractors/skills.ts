const SKILLS: string[] = [
  // Languages
  "JavaScript", "TypeScript", "Python", "Java", "Go", "Rust", "C++", "C#", "Ruby", "PHP",
  "Swift", "Kotlin", "Scala", "Dart", "R", "MATLAB", "Bash", "Shell", "Perl", "Elixir",
  "Haskell", "Clojure", "Lua", "Objective-C", "Groovy", "Solidity",

  // Frontend
  "React", "Vue", "Vue.js", "Angular", "Svelte", "SvelteKit", "Next.js", "Nuxt", "Remix",
  "Astro", "Gatsby", "Redux", "MobX", "Zustand", "Tailwind CSS", "Tailwind", "SASS",
  "SCSS", "Less", "Styled Components", "Emotion", "Material UI", "Chakra UI", "Ant Design",
  "Three.js", "D3.js", "WebGL", "HTML", "CSS",

  // Backend / runtimes
  "Node.js", "Deno", "Bun", "Express", "Fastify", "NestJS", "Koa", "Hapi",
  "Django", "Flask", "FastAPI", "Tornado", "Pyramid", "Rails", "Sinatra",
  "Spring Boot", "Spring", "Quarkus", "Micronaut", "ASP.NET", ".NET", "Laravel",
  "Symfony", "Phoenix", "Gin", "Echo", "Fiber", "Actix", "Axum", "Rocket",

  // Mobile
  "React Native", "Flutter", "SwiftUI", "Jetpack Compose", "Ionic", "Expo",

  // Databases
  "PostgreSQL", "MySQL", "SQLite", "MariaDB", "Oracle", "SQL Server", "MS SQL",
  "MongoDB", "DynamoDB", "Cassandra", "Redis", "Memcached", "Elasticsearch",
  "OpenSearch", "Neo4j", "Snowflake", "BigQuery", "Redshift", "Clickhouse",
  "InfluxDB", "TimescaleDB", "FaunaDB", "CockroachDB", "Supabase", "PlanetScale",
  "Firestore", "Firebase",

  // Cloud
  "AWS", "GCP", "Google Cloud", "Azure", "DigitalOcean", "Linode", "Heroku",
  "Vercel", "Netlify", "Railway", "Fly.io", "Cloudflare", "Render",
  "Lambda", "EC2", "S3", "RDS", "EKS", "ECS", "Fargate", "CloudFormation",
  "CloudFront", "Route53", "SQS", "SNS", "Kinesis", "DocumentDB",
  "Cloud Run", "Cloud Functions", "App Engine", "GKE", "Pub/Sub", "Dataflow",

  // DevOps
  "Docker", "Kubernetes", "K8s", "Helm", "Terraform", "Pulumi", "Ansible",
  "Chef", "Puppet", "Packer", "Vagrant", "Jenkins", "GitHub Actions", "GitLab CI",
  "CircleCI", "Travis CI", "ArgoCD", "Flux", "Spinnaker", "Tekton",
  "Prometheus", "Grafana", "Datadog", "New Relic", "Splunk", "ELK", "Loki",
  "Jaeger", "OpenTelemetry", "Sentry", "PagerDuty", "Istio", "Linkerd",

  // Data / ML
  "Pandas", "NumPy", "SciPy", "scikit-learn", "TensorFlow", "PyTorch", "Keras",
  "Hugging Face", "Transformers", "LangChain", "LlamaIndex", "OpenAI", "Anthropic",
  "Airflow", "dbt", "Spark", "Apache Spark", "Kafka", "Apache Kafka", "Flink",
  "Beam", "Hadoop", "Databricks", "Snowpark", "MLflow", "Kubeflow", "Ray",
  "Dask", "Polars",

  // Messaging / queues
  "RabbitMQ", "Kafka", "NATS", "ZeroMQ", "ActiveMQ", "Celery", "Sidekiq",
  "BullMQ", "Bull", "Temporal",

  // APIs / protocols
  "REST", "GraphQL", "gRPC", "WebSockets", "Server-Sent Events", "OpenAPI",
  "Swagger", "Protocol Buffers", "Protobuf", "tRPC",

  // Testing
  "Jest", "Vitest", "Mocha", "Chai", "Jasmine", "Cypress", "Playwright",
  "Selenium", "Puppeteer", "Testing Library", "PyTest", "Unittest", "RSpec",
  "JUnit", "TestNG", "Karma",

  // Tools / methodology
  "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence", "Notion",
  "Linear", "Asana", "Trello", "Slack", "Figma", "Sketch", "Adobe XD",
  "Agile", "Scrum", "Kanban", "TDD", "BDD", "CI/CD", "Microservices",
  "Event-Driven Architecture", "Domain-Driven Design", "DDD", "SOLID",

  // Security
  "OAuth", "OAuth2", "OpenID Connect", "OIDC", "JWT", "SAML", "SSO",
  "Penetration Testing", "Pentesting", "Vulnerability Assessment",
  "OWASP", "Burp Suite", "Metasploit", "Wireshark", "Nmap",
];

// "Workplace tool" classification — collaboration SaaS and IDEs the candidate uses,
// as opposed to infrastructure stacks (those stay in `skills`).
const TOOLS = new Set([
  "Jira", "Confluence", "Notion", "Linear", "Asana", "Trello", "Slack",
  "Figma", "Sketch", "Adobe XD", "Postman", "Insomnia", "MCP Inspector",
]);

export interface SkillExtraction {
  skills: string[];
  tools: string[];
}

export function extractSkills(text: string): SkillExtraction {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const skill of SKILLS) {
    const re = wordBoundaryRe(skill);
    if (re.test(text) || re.test(lower)) {
      found.add(skill);
    }
  }
  const skills: string[] = [];
  const tools: string[] = [];
  for (const s of found) {
    if (TOOLS.has(s)) tools.push(s);
    else skills.push(s);
  }
  return { skills: dedupeCaseInsensitive(skills), tools: dedupeCaseInsensitive(tools) };
}

function wordBoundaryRe(skill: string): RegExp {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // For tokens that contain non-word characters (Next.js, C++) use lookarounds.
  return new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, "i");
}

function dedupeCaseInsensitive(arr: string[]): string[] {
  const seen = new Map<string, string>();
  for (const v of arr) {
    const k = v.toLowerCase();
    if (!seen.has(k)) seen.set(k, v);
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

export function topKeywords(text: string, top = 25): string[] {
  const stop = STOPWORDS;
  const counts = new Map<string, number>();
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-/ ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stop.has(t));
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([word]) => word);
}

const STOPWORDS = new Set([
  "the","and","for","with","that","this","you","your","our","but","not","are","was","were",
  "have","has","had","from","into","over","about","than","then","also","any","all","more",
  "most","such","some","just","like","across","using","used","use","including","include",
  "team","teams","work","worked","working","build","built","building","experience",
  "experienced","year","years","ability","able","strong","excellent","good","great",
  "senior","junior","level","skills","skill","tools","tool","tech","technology",
  "technologies","stack","based","via","through","upon","onto","etc","www","com","org",
  "net","email","phone","resume","cv","page","section","new","yet","per","each",
  "while","when","what","where","which","who","whom","how","why",
]);
