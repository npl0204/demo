import express, { Response } from "express";
import booksRouter from "./book.js";
import authorsRouter from "./author.js";

let app = express();
app.use(express.json());
app.use(express.static("public"));

// app.all("*", async (req, res, next) => {
//   let {method, originalUrl, query, body} = req;
//   console.log({method, originalUrl, query, body});
//   next();
// });

// app.use((req, res, next) => {
//   let send = res.send;
//   res.send = (c) => {
//     console.log({status: res.statusCode, body: c});
//     return res.send(c);
//   };
//   next();
// });

app.use("/api/books", booksRouter);
app.use("/api/authors", authorsRouter);

let port = 3000;
let host = "localhost";
let protocol = "http";
app.listen(port, host, () => {
    console.log(`${protocol}://${host}:${port}`);
});
