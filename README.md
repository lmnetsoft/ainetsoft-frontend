 mvn clean compile && mvn spring-boot:run

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