# HealLog v2.0 - Documentation

**Version:** 2.0
**Last Updated:** January 2026
**Target:** Multi-tenant Home Care Operations Platform

---

## Overview

This documentation covers the new HealLog architecture, transitioning from a single-clinic EMR to a **Multi-tenant Operations OS for Home Care Agencies**. The new architecture focuses on:

- **Field Staff Operations** (GPS tracking, offline-first mobile app)
- **Agency Management** (staff rostering, billing, payroll)
- **Multi-tenant Isolation** (PostgreSQL RLS)
- **Revenue Generation** (billing, payment integration)

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [GETTING_STARTED.md](./GETTING_STARTED.md) | **Start here!** Quick setup guide for all roles |
| [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) | System architecture, tech stack, and component diagram |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | PostgreSQL schema with Row-Level Security |
| [API_REFERENCE.md](./API_REFERENCE.md) | Complete REST API endpoint documentation |
| [USER_ROLES_PERMISSIONS.md](./USER_ROLES_PERMISSIONS.md) | Role-based access control (RBAC) |
| [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) | Web dashboard + Mobile PWA architecture |
| [OFFLINE_SYNC_STRATEGY.md](./OFFLINE_SYNC_STRATEGY.md) | WatermelonDB offline-first sync strategy |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | AWS infrastructure setup and CI/CD |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) | Migration from v1.x to v2.0 |
| [FEATURE_SPECIFICATIONS.md](./FEATURE_SPECIFICATIONS.md) | Detailed feature specifications |
| [SECURITY_COMPLIANCE.md](./SECURITY_COMPLIANCE.md) | Security, compliance, and audit logging |

---

## Quick Links

### For Developers
- [Backend Setup](./DEPLOYMENT_GUIDE.md#backend-setup)
- [Frontend Setup](./DEPLOYMENT_GUIDE.md#frontend-setup)
- [Database Migrations](./DATABASE_SCHEMA.md#migrations)
- [API Authentication](./API_REFERENCE.md#authentication)

### For Operations
- [AWS Infrastructure](./DEPLOYMENT_GUIDE.md#aws-infrastructure)
- [Monitoring & Alerts](./SECURITY_COMPLIANCE.md#monitoring)
- [Backup & Recovery](./DEPLOYMENT_GUIDE.md#backup-recovery)

### For Product
- [Feature Roadmap](./FEATURE_SPECIFICATIONS.md#roadmap)
- [User Roles](./USER_ROLES_PERMISSIONS.md)
- [Market Strategy](./FEATURE_SPECIFICATIONS.md#market-strategy)

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND CLIENTS                        │
├─────────────────────────────────────────────────────────────┤
│  Web Dashboard (React/Vite)  │  Mobile PWA (Expo/RN)        │
│  - Admin Dashboard           │  - Field Staff App            │
│  - Finance Dashboard         │  - Offline-first             │
│  - Receptionist View         │  - GPS Check-in/out          │
└──────────────────────────────┴──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (ALB)                         │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND (ECS)                       │
├─────────────────────────────────────────────────────────────┤
│  Auth │ Users │ Patients │ Staff │ Rosters │ Billing │ ...  │
└─────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │      │     S3       │
│  (RDS + RLS) │      │ (ElastiCache)│      │  (Documents) │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## Key Changes from v1.x

| Aspect | v1.x (Current) | v2.0 (New) |
|--------|----------------|------------|
| **Database** | MongoDB | PostgreSQL with RLS |
| **Multi-tenancy** | None | Full tenant isolation |
| **Target User** | Single clinic | Home care agencies |
| **Field Staff** | Limited | Full mobile PWA |
| **Billing** | None | Invoice + Razorpay |
| **Payroll** | None | Staff commission/salary |
| **Offline** | Basic | Full WatermelonDB sync |
| **SMS/WhatsApp** | None | MSG91 integration |

---

## Revenue Model

**Target:** Home care agencies (nursing bureaus) in India

**Pricing Tiers:**
- Free: Up to 5 staff, basic features
- Pro: Up to 25 staff, full features, ₹2,000/month
- Agency: Unlimited staff, priority support, ₹5,000/month

**Revenue Target:** ₹15-20L MRR within 18-24 months

---

## Contact

- **Technical Questions:** Backend team
- **Product Questions:** Product team
- **Support:** support@heallog.in
