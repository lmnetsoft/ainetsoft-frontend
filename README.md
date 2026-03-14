 mvn clean compile -DskipTests && mvn spring-boot:run

mvn clean compile -DskipTests && \
mvn spring-boot:run -Dspring-boot.run.arguments="--app.seed.mock-data=true"

mvn clean compile -DskipTests && \
mvn spring-boot:run -Dspring-boot.run.arguments="--app.seed.mock-data=false"

mvn clean compile -DskipTests && \
mvn spring-boot:run -Dspring-boot.run.arguments="--app.seed.mock-data=false --admin.setup.password=RealStrongPass123! --ainetsoft.jwt.secret=HighlySecureRandomString64Chars"

docker run -d \
  --name ainetsoft-mongodb \
  --network ainetsoft-network \
  --restart always \
  -p 27017:27017 \
  -v ainetsoft_db_data:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD='Changeme!' \
  mongo:8.0

mongosh "mongodb://admin:Changeme%21@localhost:27017/ainetsoft?authSource=admin"

use ainetsoft
db.users.find({ email: "dev_test@ainetsoft.com" }).pretty()


// Remove the record that has no email/phone
db.users.deleteOne({ _id: ObjectId('699eefca676938d56c196e75') });

// Remove the record that has an empty email string
db.users.deleteOne({ email: "" });

db.users.find()

show collections

db.users.find({email: "lmnetsoft@yahoo.com.vn"}, {bankAccounts: 1, addresses: 1}).pretty()


# AiNetsoft - Shopee-Style Moderated Marketplace

AiNetsoft is a full-stack e-commerce platform built with a high-security "Moderation First" philosophy. It supports multi-role users (Admin, Seller, Buyer) and features international phone validation.

## 🚀 Tech Stack
- **Frontend:** React (Vite) + TypeScript + Tailwind CSS
- **Backend:** Spring Boot (Java 17) + Spring Security
- **Database:** MongoDB
- **Communication:** Azure Communication Services (SMS/Email)

## 🛡️ Core Business Logic (The "Moderation Model")
1. **Seller Verification:** Users must link a valid Phone, Address, and Bank Account before requesting Seller status. All requests are held in a `PENDING` state until a Global Admin approves them.
2. **Product Approval:** All new products and major edits are set to `PENDING`. They are invisible on the Home page until approved by the Admin to ensure content quality and security.
3. **Identity Sync:** Uses HTTP-Only cookies and LocalStorage sync to maintain session persistence across page refreshes.

## 🛠️ Getting Started

### Backend Setup
1. Configure `src/main/resources/application.properties` with your MongoDB URI.
2. Set your Admin Bootstrap credentials:
   - `admin.setup.email=admin@ainetsoft.com`
   - `admin.setup.password=Admin@123456`
3. Run `./mvnw spring-boot:run`

### Frontend Setup
1. Run `npm install`
2. Run `npm run dev`
3. Access at `http://localhost:5173`

## 🏛️ Admin Credentials (Initial Seed)
- **Email:** `admin@ainetsoft.com`
- **Default Password:** `Admin@123456`
- **Access:** `/admin/dashboard`