Deployment Guide — Frontend‑Only Web Component App on AWS EKS (Using the Original NewsAPI.org)**

This guide documents the complete workflow for deploying the **News Dashboard** frontend to **Amazon EKS**, using **ECR** for container storage, **OIDC** for secure authentication, and a **LoadBalancer Service** for public access.

Option A demonstrates:

- Cloud‑native deployment  
- Kubernetes fundamentals  
- Secure container workflows  
- **Real API calls using the original NewsAPI.org**  
- No backend services  
- No microservices yet  

This is the foundation for Option B, where backend microservices will be added.

---

# 📁 **Recommended Folder Structure**

Your repository should follow a clean, professional structure:

```
/
├── src/                     # Frontend source code (Web Components)
├── dist/                    # Build output (ignored in repo)
├── Dockerfile               # Container build instructions
├── package.json             # Build scripts and dependencies
├── README.md                # Project documentation
└── k8s/                     # Kubernetes manifests
    ├── deployment.yaml
    └── service.yaml
```

This structure:

- Keeps the root clean  
- Groups Kubernetes manifests logically  
- Prepares the repo for Option B (backend services)  
- Matches industry‑standard DevOps practices  

---

# 🧱 **Architecture Overview (Mermaid Diagram)**

```mermaid
flowchart TD

    A[Developer Machine] -->|1. Build Docker Image| B[Docker Image: news-dashboard]
    B -->|2. Push Image| C[ECR Repository]

    C -->|3. EKS Pulls Image| D[EKS Cluster]

    D -->|4. Deployment Creates Pods| E[Frontend Pods Running in Kubernetes]

    E -->|5. Exposed via Service| F[AWS LoadBalancer (ELB/NLB)]

    F -->|6. Public URL| G[User Browser]

    G -->|7. Frontend Calls API| H[NewsAPI.org]
```

This diagram shows the **exact flow** of Option A:

- You build locally  
- Push to ECR  
- EKS pulls the image  
- Kubernetes runs the Pods  
- LoadBalancer exposes the app  
- Browser calls **NewsAPI.org** directly  

---

# 🧠 **Why These AWS Choices Were Made**

## ⭐ 1. Amazon ECR (Elastic Container Registry)

Chosen because:

- Native integration with EKS  
- Secure, private image storage  
- Works with AWS SSO + OIDC  
- Avoids Docker Hub rate limits  

This is the standard for Kubernetes on AWS.

---

## ⭐ 2. Amazon EKS (Elastic Kubernetes Service)

Chosen because:

- You learn **real Kubernetes**, not a simplified PaaS  
- You prepare for **multi‑service deployments** in Option B  
- You gain experience with:
  - Deployments  
  - Services  
  - Pods  
  - LoadBalancers  
  - Node groups  

This mirrors real enterprise DevOps workflows.

---

## ⭐ 3. OIDC Enabled on the Cluster

Chosen because:

- It allows **IAM Roles for Service Accounts (IRSA)**  
- Eliminates long‑lived AWS keys  
- Enables secure Pod‑level permissions  
- Required for production‑grade Kubernetes on AWS  

This is the correct modern setup.

---

## ⭐ 4. LoadBalancer Service (instead of Ingress)

Chosen because:

- It automatically provisions an AWS ELB  
- Gives you a public URL instantly  
- Avoids Ingress complexity for Option A  
- Perfect for a single‑service deployment  

This keeps the learning curve clean.

---

## ⭐ 5. Why We Inspected `package.json` Before Writing the Dockerfile

Before writing the Dockerfile, we examined `package.json` to understand:

- The **build script** (`npm run build`)  
- The **output directory** (`dist/`)  
- Whether the app is static or needs a dev server  
- Which dependencies are needed at build time  

This matters because:

- The Dockerfile must match the actual build process  
- We need a **multi‑stage build**:
  - Stage 1: Node.js → build assets  
  - Stage 2: Nginx → serve static files  
- We avoid shipping Node.js in production  

This is a core DevOps skill:  
**Understand the build pipeline before containerizing.**

---

# 🧾 **Original API Usage (NewsAPI.org)**

Your project uses the original NewsAPI configuration:

```js
// config.js
export const API_URL = 'https://newsapi.org/v2';
export const API_KEY = 'YOUR_NEWSAPI_KEY_HERE';
```

And the original API functions:

```js
import { API_URL, API_KEY } from './config.js';

// Fetch top headline sources
export async function fetchTopHeadlineSources() {
  const response = await fetch(`${API_URL}/top-headlines/sources?apiKey=${API_KEY}`);
  const data = await response.json();
  return data.sources || [];
}

// Fetch top headlines for a given source
export async function fetchTopHeadlines(source) {
  const response = await fetch(
    `${API_URL}/top-headlines?sources=${source}&apiKey=${API_KEY}`
  );
  const data = await response.json();
  return data.articles || [];
}
```

### ⚠️ Important Note  
NewsAPI **may block browser calls from cloud deployments** unless you have a paid plan.  
This README keeps the original API for consistency with your repo.

Option B will solve this by introducing a backend proxy.

---

# 🐳 **Dockerfile (Derived From `package.json`)**

Because your app builds into static assets, we used a **multi‑stage Dockerfile**:

```dockerfile
# Stage 1: Build the frontend
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Why this design?

- **Node.js** is only used for building  
- **Nginx** serves static files efficiently  
- The final image is small and production‑ready  

---

# 🚀 **Deployment Steps**

## 1. Build the Docker image

```bash
docker build -t news-dashboard .
```

## 2. Create ECR repository

```bash
aws ecr create-repository \
  --repository-name news-dashboard \
  --region ca-central-1
```

## 3. Authenticate Docker to ECR (AWS SSO)

```bash
aws ecr get-login-password --region ca-central-1 \
  | docker login \
    --username AWS \
    --password-stdin 408433988572.dkr.ecr.ca-central-1.amazonaws.com
```

## 4. Tag and push the image

```bash
docker tag news-dashboard:latest \
  408433988572.dkr.ecr.ca-central-1.amazonaws.com/news-dashboard:latest

docker push \
  408433988572.dkr.ecr.ca-central-1.amazonaws.com/news-dashboard:latest
```

---

# ☸️ **Create the EKS Cluster (with OIDC)**

```bash
eksctl create cluster \
  --name web-component-cluster \
  --region ca-central-1 \
  --with-oidc \
  --nodes 2 \
  --node-type t3.medium
```

Verify:

```bash
kubectl get nodes
```

---

# 📄 **Kubernetes Deployment**

`k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: news-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: news-frontend
  template:
    metadata:
      labels:
        app: news-frontend
    spec:
      containers:
        - name: news-frontend
          image: 408433988572.dkr.ecr.ca-central-1.amazonaws.com/news-dashboard:latest
          ports:
            - containerPort: 80
```

Apply:

```bash
kubectl apply -f k8s/deployment.yaml
```

---

# 🌐 **LoadBalancer Service**

`k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: news-frontend-service
spec:
  type: LoadBalancer
  selector:
    app: news-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
```

Apply:

```bash
kubectl apply -f k8s/service.yaml
```

---

# 🌍 **Get the Public URL**

```bash
kubectl get svc news-frontend-service
```

Example:

```
EXTERNAL-IP: a468643f5e45c4580ba223d30d827784-957047206.ca-central-1.elb.amazonaws.com
```

Open in browser.

---

# 🔄 **Updating the Deployment**

```bash
docker build -t news-dashboard .
docker tag news-dashboard:latest 408433988572.dkr.ecr.ca-central-1.amazonaws.com/news-dashboard:latest
docker push 408433988572.dkr.ecr.ca-central-1.amazonaws.com/news-dashboard:latest

kubectl rollout restart deployment news-frontend
```

---

# 🧹 **Clean Up**

```bash
eksctl delete cluster \
  --name web-component-cluster \
  --region ca-central-1
```

---

# 🏁 **Option A Summary**

Option A demonstrates:

- Building a frontend container  
- Publishing to ECR  
- Creating an EKS cluster with OIDC  
- Deploying a Kubernetes Deployment  
- Exposing it with a LoadBalancer  
- Calling the **original NewsAPI.org** directly from the browser  
- No backend services  
- No automation yet  

This sets the foundation for **Option B**, where you will:

- Add a backend container  
- Use ClusterIP for internal communication  
- Proxy NewsAPI calls server‑side  
- Deploy multiple microservices  
- Automate everything with GitHub Actions  