import express, { Response } from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { AuthorResponse, PostResponse } from "./type.js";

const router = express.Router();

let db = await open({
    filename: "../database.db",
    driver: sqlite3.Database,
});
await db.get("PRAGMA foreign_keys = ON");

// // Set up example for HW2
// let a = await db.all("SELECT * FROM authors");
// if(a.length === 0) {
//   await db.run(`INSERT INTO authors(id, name, bio) VALUES (1, "John Doe", "John Doe is a Fiction writer")`);
//   await db.run(`INSERT INTO authors(id, name, bio) VALUES (2, "Jane Doe", "Jane Doe is a Romance writer")`);
// }

//AUTHOR
// get all authors 
router.get("/api/authors", async (req, res: AuthorResponse) => {
  let authors = await db.all("SELECT * FROM authors");
  return res.status(200).json(authors);
});

// get 1 author with id
router.get("/api/author/:id", async (req, res: AuthorResponse) => {
  const id = req.params.id;
  if(!id) {
    return res.status(400).json({ error: "Please provide an id for author" });
  }
  let author = await db.all(`SELECT * FROM authors WHERE id >= ${id}`);
  if (author.length != 0) {
    return res.status(200).json(author);
  } else {
    return res.status(400).json({ error: `No authors with ID ${id} found` });
  }
});

// insert an author
router.post("/api/author", async (req, res: PostResponse) => {
  const author = req.body.author;
  if (!author) {
    return res.status(400).json({ error: "Author is required" });
  }
  let id = (await db.all("SELECT * FROM authors")).length > 0 ? await db.all("SELECT MAX(CAST(id AS INT )) FROM authors") : "1";
  let INSERT_SQL = await db.prepare(
    "INSERT INTO authors(id, name, bio) VALUES (?, ?, ?)" 
  );
  await INSERT_SQL.bind([id, author.name, author.bio]);
  await INSERT_SQL.run().then(() => {
    return res.json({ message: `Successfully added. Author ID is ${id}`, table: author });
  });
});

// put to update an author
router.put("/api/author/:id", async (req, res: AuthorResponse) => {
  const authorReq = req.body.author;
  const id = req.params.id;
  if (!authorReq) {
    return res.status(400).json({ error: "Author is required" });
  }
  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }
  let author = await db.all(`SELECT * FROM authors WHERE id = ${id}`);
  if (author.length === 0) {
    return res.status(400).json({ error: `No authors with ID ${id} found` });
  }
  db.run(`UPDATE authors set name = ?, bio = ? WHERE id = ?`,
      [authorReq.name, authorReq.bio, id]);
  return res.sendStatus(200);
});

//  delte author but not delete author that has books
router.delete("/api/author/:id", async (req, res: AuthorResponse) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }
  let book = await db.all(`SELECT * FROM books WHERE author_id = ${id}`);
  if (book.length != 0) {
    return res.status(400).json({ error: "Cannot delete since author still has books associated with them" });
  }
  let author = await db.all(`SELECT * FROM authors WHERE id = ${id}`);
  if(author.length === 0) {
    return res.status(400).json({ error: `No authors with ID ${id} found. Please check the authors list to see valid author ID.` });
  }
  await db.run(`DELETE FROM authors WHERE id = ?`, [id]);
  return res.sendStatus(200);
});

export default router;