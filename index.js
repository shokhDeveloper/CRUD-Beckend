import http from "node:http";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
const PORT = 1000;
const wifiInterface = os.networkInterfaces();
let WIFI_IP_ADRESS = "";
try {
  WIFI_IP_ADRESS = wifiInterface["Беспроводная сеть 3"].find(
    (item) => item.family == "IPv4"
  ).address;
} catch (error) {
  console.log("Get to WIFI Adress ERROR", error.message);
}
const server = http.createServer(async (req, res) => {
  if (req.url == "/api/users" && req.method == "GET") {
    res.setHeader("Content-type", "application/json");
    let users = await fs.readFile(path.join("database", "users.json"), "UTF-8");
    users = users ? JSON.parse(users) : [];
    res.end(JSON.stringify(users));
  } else if (req.url == "/api/users" && req.method == "POST") {
    let data = "";
    req.on("data", (buffer) => {
      data += buffer;
    });
    req.on("end", async () => {
      const newUser = JSON.parse(data);
      let users = await fs.readFile(
        path.join("database", "users.json"),
        "UTF-8"
      );
      users = users ? JSON.parse(users) : [];
      if (!newUser?.username) {
        req.statusCode = 300;
        res.end("Username is required !");
      } else {
        res.statusCode = 201;
        newUser.userId = users.length ? users[users.length - 1].userId + 1 : 1;
        users.push(newUser);
        await fs.writeFile(
          path.join("database", "users.json"),
          JSON.stringify(users, null, 4)
        );
        res.end(data);
      }
    });
  } else if (req.method == "GET" && req.url == "/create") {
    res.setHeader("Content-type", "text/html");
    res.end(await fs.readFile(path.join("create", "index.html")));
  } else if (req.method == "GET" && req.url == "/render") {
    res.setHeader("Content-Type", "text/html");
    res.end(await fs.readFile(path.join("render", "index.html")));
  } else if (req.method == "DELETE" && req.url.startsWith("/api/users/")) {
    const userId = req.url.split("/").pop();

    let users = await fs.readFile(path.join("database", "users.json"));
    users = users ? JSON.parse(users) : [];
    if (users.length) {
      const findUser = users.find((item) => item.userId == Number(userId));
      const filterUsers = users.filter(
        (item) => item.userId !== Number(userId)
      );
      if (users.length == filterUsers) {
        res.end(JSON.stringify({ message: "User not found" }));
      } else {
        await fs.writeFile(
          path.join("database", "users.json"),
          JSON.stringify(filterUsers, null, 4)
        );
        res.end(
          JSON.stringify({
            message: "Deleted Successful",
            deleteUser: findUser,
          })
        );
      }
    }
  } else if (
    (req.method == "PUT" || req.method == "PATCH") &&
    req.url.startsWith("/api/users/")
  ) {
    let userId = Number(req.url.split("/").pop());
    let users = await fs.readFile(path.join("database", "users.json"));
    users = users ? JSON.parse(users) : [];
    if(users.length){
        let userIndex = users.findIndex((item) => item.userId == userId)
        if(userIndex !== -1){
            let data = "";
            req.on("data", (buffer) => {
                data += buffer
            })
            req.on("end", async () => {
                let user = JSON.parse(data);
                users[userIndex] = {...users[userIndex], ...user}
                await fs.writeFile(path.join("database", "users.json"), JSON.stringify(users, null, 4))
                res.setHeader("Content-type", "application/json")
                res.end(JSON.stringify({
                    message: "Successfull updated",
                    updatedUser: users[userIndex]
                }))
            })
        }else{
            req.statusCode == 404;
            res.end("User not found")
        }
    }
  } else if (req.method == "GET" && req.url.startsWith("/update/api/users/")) {
    res.setHeader("Content-Type", "text/html");
    res.end(await fs.readFile(path.join("update", "index.html")));
  } else {
    res.end("Not found");
  }
});
server.listen(PORT, () => {
  console.log(`server is running in http://${WIFI_IP_ADRESS}:${PORT}`);
});
