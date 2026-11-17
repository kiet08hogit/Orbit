## CI/CD  
  
Use GitHub Actions to:  
  
1. Run linting and unit tests on every push  
2. Build the frontend and backend  
3. Deploy automatically to AWS after successful checks  
  
---  
  
## Environments  
  
Recommended environments:  
  
### Development  
- Local frontend (Next.js)
- Local backend (NestJS)
- Local PostgreSQL (Neon or Docker)
- Redis: Amazon ElastiCache (same setup as production; see infra/elasticache-waf.yml)
  
### Production  
- Frontend Hosting: AWS Amplify (or Vercel)
- Backend Hosting: AWS ECS (Fargate) or App Runner
- Database: Amazon RDS (PostgreSQL)
- Caching & Queues: Amazon ElastiCache (Redis)
- Edge: AWS WAF on the API load balancer (infra/elasticache-waf.yml)
- File Storage: Amazon S3