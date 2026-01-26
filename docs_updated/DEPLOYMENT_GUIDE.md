# HealLog v2.0 - Deployment Guide

**Version:** 2.0
**Last Updated:** January 2026

---

## 1. Overview

This guide covers deploying HealLog v2.0 to AWS infrastructure for production use.

### Infrastructure Summary

| Component | AWS Service | Spec |
|-----------|-------------|------|
| Compute | ECS Fargate | 2x (2 vCPU, 4GB RAM) |
| Database | RDS PostgreSQL | db.t4g.small, Multi-AZ |
| Cache | ElastiCache Redis | cache.t4g.small |
| Storage | S3 | Standard tier |
| CDN | CloudFront | Global distribution |
| Load Balancer | ALB | Application LB |
| DNS | Route 53 | Domain management |

---

## 2. Prerequisites

### 2.1 AWS Account Setup

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials
aws configure
# Enter: AWS Access Key ID, Secret Access Key, Region (ap-south-1)
```

### 2.2 Required Tools

- Docker 24+
- Node.js 18+
- Python 3.11+
- Git
- Terraform (optional, for IaC)

---

## 3. Infrastructure Setup

### 3.1 VPC and Networking

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=heallog-vpc}]'

# Create subnets
# Public subnets (for ALB)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone ap-south-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone ap-south-1b

# Private subnets (for ECS, RDS)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.10.0/24 --availability-zone ap-south-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.11.0/24 --availability-zone ap-south-1b

# Create Internet Gateway
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --vpc-id vpc-xxx --internet-gateway-id igw-xxx

# Create NAT Gateway (for private subnet outbound)
aws ec2 allocate-address --domain vpc
aws ec2 create-nat-gateway --subnet-id subnet-public-xxx --allocation-id eipalloc-xxx
```

### 3.2 Security Groups

```bash
# ALB Security Group
aws ec2 create-security-group \
  --group-name heallog-alb-sg \
  --description "ALB Security Group" \
  --vpc-id vpc-xxx

aws ec2 authorize-security-group-ingress \
  --group-id sg-alb-xxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-alb-xxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# ECS Security Group
aws ec2 create-security-group \
  --group-name heallog-ecs-sg \
  --description "ECS Security Group" \
  --vpc-id vpc-xxx

aws ec2 authorize-security-group-ingress \
  --group-id sg-ecs-xxx \
  --protocol tcp \
  --port 8000 \
  --source-group sg-alb-xxx

# RDS Security Group
aws ec2 create-security-group \
  --group-name heallog-rds-sg \
  --description "RDS Security Group" \
  --vpc-id vpc-xxx

aws ec2 authorize-security-group-ingress \
  --group-id sg-rds-xxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-ecs-xxx

# Redis Security Group
aws ec2 create-security-group \
  --group-name heallog-redis-sg \
  --description "Redis Security Group" \
  --vpc-id vpc-xxx

aws ec2 authorize-security-group-ingress \
  --group-id sg-redis-xxx \
  --protocol tcp \
  --port 6379 \
  --source-group sg-ecs-xxx
```

### 3.3 RDS PostgreSQL Setup

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name heallog-db-subnet \
  --db-subnet-group-description "HealLog DB Subnet Group" \
  --subnet-ids subnet-private-1 subnet-private-2

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier heallog-db \
  --db-instance-class db.t4g.small \
  --engine postgres \
  --engine-version 15.4 \
  --master-username heallog_admin \
  --master-user-password "SecurePassword123!" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-rds-xxx \
  --db-subnet-group-name heallog-db-subnet \
  --multi-az \
  --storage-encrypted \
  --backup-retention-period 30 \
  --deletion-protection \
  --tags Key=Environment,Value=production
```

### 3.4 ElastiCache Redis Setup

```bash
# Create cache subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name heallog-cache-subnet \
  --cache-subnet-group-description "HealLog Cache Subnet" \
  --subnet-ids subnet-private-1 subnet-private-2

# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id heallog-redis \
  --cache-node-type cache.t4g.small \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name heallog-cache-subnet \
  --security-group-ids sg-redis-xxx \
  --tags Key=Environment,Value=production
```

### 3.5 S3 Bucket Setup

```bash
# Create bucket for documents
aws s3 mb s3://heallog-documents-prod --region ap-south-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket heallog-documents-prod \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket heallog-documents-prod \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Set CORS for uploads
aws s3api put-bucket-cors \
  --bucket heallog-documents-prod \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["https://app.heallog.in"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }]
  }'
```

---

## 4. Application Deployment

### 4.1 ECR Repository

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name heallog-backend \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Get login command
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin xxx.dkr.ecr.ap-south-1.amazonaws.com
```

### 4.2 Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/v1/health || exit 1

# Start server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 4.3 Build and Push Image

```bash
# Build image
docker build -t heallog-backend:latest ./backend

# Tag for ECR
docker tag heallog-backend:latest \
  xxx.dkr.ecr.ap-south-1.amazonaws.com/heallog-backend:latest

# Push to ECR
docker push xxx.dkr.ecr.ap-south-1.amazonaws.com/heallog-backend:latest
```

### 4.4 ECS Task Definition

```json
{
  "family": "heallog-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "executionRoleArn": "arn:aws:iam::xxx:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::xxx:role/heallogTaskRole",
  "containerDefinitions": [
    {
      "name": "heallog-backend",
      "image": "xxx.dkr.ecr.ap-south-1.amazonaws.com/heallog-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "ENVIRONMENT", "value": "production"},
        {"name": "LOG_LEVEL", "value": "INFO"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:ap-south-1:xxx:secret:heallog/db-url"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:ap-south-1:xxx:secret:heallog/redis-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:ap-south-1:xxx:secret:heallog/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/heallog-backend",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/v1/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 4.5 ECS Service

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name heallog-cluster

# Create service
aws ecs create-service \
  --cluster heallog-cluster \
  --service-name heallog-backend \
  --task-definition heallog-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration '{
    "awsvpcConfiguration": {
      "subnets": ["subnet-private-1", "subnet-private-2"],
      "securityGroups": ["sg-ecs-xxx"],
      "assignPublicIp": "DISABLED"
    }
  }' \
  --load-balancers '[{
    "targetGroupArn": "arn:aws:elasticloadbalancing:ap-south-1:xxx:targetgroup/heallog-tg/xxx",
    "containerName": "heallog-backend",
    "containerPort": 8000
  }]' \
  --health-check-grace-period-seconds 120
```

### 4.6 Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name heallog-alb \
  --subnets subnet-public-1 subnet-public-2 \
  --security-groups sg-alb-xxx \
  --scheme internet-facing \
  --type application

# Create target group
aws elbv2 create-target-group \
  --name heallog-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /v1/health \
  --health-check-interval-seconds 30

# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:ap-south-1:xxx:loadbalancer/app/heallog-alb/xxx \
  --protocol HTTPS \
  --port 443 \
  --ssl-policy ELBSecurityPolicy-TLS-1-2-2017-01 \
  --certificates CertificateArn=arn:aws:acm:ap-south-1:xxx:certificate/xxx \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:ap-south-1:xxx:targetgroup/heallog-tg/xxx

# Redirect HTTP to HTTPS
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:ap-south-1:xxx:loadbalancer/app/heallog-alb/xxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
```

---

## 5. CI/CD Pipeline

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: ap-south-1
  ECR_REPOSITORY: heallog-backend
  ECS_CLUSTER: heallog-cluster
  ECS_SERVICE: heallog-backend

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-asyncio

      - name: Run tests
        run: |
          cd backend
          pytest tests/ -v

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster $ECS_CLUSTER \
            --services $ECS_SERVICE
```

---

## 6. Database Migrations

### 6.1 Run Migrations

```bash
# Using Alembic
cd backend

# Create migration
alembic revision --autogenerate -m "Add new table"

# Run migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### 6.2 Migration in CI/CD

```yaml
# Add to deploy job
- name: Run database migrations
  run: |
    # Use AWS Systems Manager to run migration
    aws ssm send-command \
      --instance-ids i-xxx \
      --document-name "AWS-RunShellScript" \
      --parameters 'commands=["cd /app && alembic upgrade head"]'
```

---

## 7. Monitoring & Logging

### 7.1 CloudWatch Setup

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/heallog-backend

# Set retention
aws logs put-retention-policy \
  --log-group-name /ecs/heallog-backend \
  --retention-in-days 30

# Create metric filter for errors
aws logs put-metric-filter \
  --log-group-name /ecs/heallog-backend \
  --filter-name ErrorCount \
  --filter-pattern "ERROR" \
  --metric-transformations \
    metricName=ErrorCount,metricNamespace=HealLog,metricValue=1
```

### 7.2 CloudWatch Alarms

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name heallog-high-error-rate \
  --metric-name ErrorCount \
  --namespace HealLog \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-south-1:xxx:heallog-alerts

# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name heallog-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --dimensions Name=ClusterName,Value=heallog-cluster Name=ServiceName,Value=heallog-backend \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:ap-south-1:xxx:heallog-alerts
```

### 7.3 Sentry Integration

```python
# In main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment=os.getenv("ENVIRONMENT", "development"),
)
```

---

## 8. Backup & Recovery

### 8.1 RDS Automated Backups

```bash
# Verify backup settings
aws rds describe-db-instances \
  --db-instance-identifier heallog-db \
  --query 'DBInstances[0].{BackupRetention:BackupRetentionPeriod,BackupWindow:PreferredBackupWindow}'

# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier heallog-db \
  --db-snapshot-identifier heallog-db-manual-$(date +%Y%m%d)
```

### 8.2 S3 Backup

```bash
# Enable cross-region replication
aws s3api put-bucket-replication \
  --bucket heallog-documents-prod \
  --replication-configuration '{
    "Role": "arn:aws:iam::xxx:role/s3-replication-role",
    "Rules": [{
      "Status": "Enabled",
      "Priority": 1,
      "DeleteMarkerReplication": {"Status": "Disabled"},
      "Filter": {},
      "Destination": {
        "Bucket": "arn:aws:s3:::heallog-documents-backup-mumbai"
      }
    }]
  }'
```

### 8.3 Disaster Recovery

| Scenario | RTO | RPO | Recovery Steps |
|----------|-----|-----|----------------|
| ECS failure | 5 min | 0 | Auto-healing by ECS |
| RDS failure | 10 min | 5 min | Automatic failover to standby |
| Region failure | 4 hours | 1 hour | Restore from cross-region backup |
| Data corruption | 1 hour | 24 hours | Restore from daily snapshot |

---

## 9. Cost Optimization

### 9.1 Monthly Cost Estimate

| Service | Spec | Est. Cost |
|---------|------|-----------|
| ECS Fargate | 2x (2 vCPU, 4GB) | $100-150 |
| RDS PostgreSQL | db.t4g.small, Multi-AZ | $50-80 |
| ElastiCache | cache.t4g.small | $30-50 |
| S3 + CloudFront | ~100GB | $20-50 |
| ALB | Standard | $20 |
| Data Transfer | ~100GB/month | $10-20 |
| **TOTAL** | | **$230-370/month** |

### 9.2 Cost Saving Tips

1. Use Reserved Instances for RDS (save 30-40%)
2. Use Savings Plans for Fargate (save 20%)
3. Enable S3 Intelligent Tiering
4. Use CloudWatch Logs retention policies
5. Right-size instances based on actual usage

---

## 10. Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Security groups restrict access
- [ ] RDS encryption enabled
- [ ] S3 bucket policies configured
- [ ] IAM roles follow least privilege
- [ ] Secrets stored in Secrets Manager
- [ ] VPC flow logs enabled
- [ ] CloudTrail enabled
- [ ] WAF configured on ALB
- [ ] Penetration testing scheduled

---

## 11. Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [Security & Compliance](./SECURITY_COMPLIANCE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
