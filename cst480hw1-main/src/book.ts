import express, { Response } from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { BookResponse, PostResponse } from "./type.js";

const router = express.Router();

let db = await open({
    filename: "../database.db",
    driver: sqlite3.Database,
});
await db.get("PRAGMA foreign_keys = ON");

// // Set up example for HW2
// let b = await db.all("SELECT * FROM books");
// if(b.length === 0) {
//   await db.run(`INSERT INTO books(id, author_id, title, pub_year, genre) VALUES (1, 1, "Book of Fiction", 2020, "Fiction")`);
//   await db.run(`INSERT INTO books(id, author_id, title, pub_year, genre) VALUES (2, 2, "Book of Romance", 2010, "Romance")`);
// }

//BOOK
// get all books 
router.get("/api/books", async (req, res: BookResponse) => {
  let books = await db.all("SELECT * FROM books");
  return res.status(200).json(books);
});

// get all books on or after a certain year
router.get("/api/book", async (req, res: BookResponse) => {
  const year = req.query.year;
  if (!year) {
    return res.status(400).json({ error: "Book is required" });
  }
  if (isNaN(+year)) {
    return res.status(400).json({ error: "Year is not valid. Year must be a number." });
  }
  let filteredBooks = await db.all(`SELECT * FROM books WHERE pub_year >= ${year}`);
  if (filteredBooks.length > 0) {
    return res.status(200).json(filteredBooks);
  }
  return res.status(400).json({ error: `No books on or after ${year} found` })
});

// get 1 book with id
router.get("/api/book/:id", async (req, res: BookResponse) => {
  const id = req.params.id;
  if(!id) {
    return res.status(400).json({ error: "Please provide an id for book" });
  }
  let book = await db.all(`SELECT * FROM books WHERE id >= ${id}`);
  if (book.length != 0) {
    return res.status(200).json(book);
  } else {
    return res.status(400).json({ error: `No books with ID ${id} found` });
  }
});

// insert a book
router.post("/api/book", async (req, res: PostResponse) => {
  const book = req.body.book;
  if (!book) {
    return res.status(400).json({ error: "Book is required" });
  }
  if (isNaN(Number(book.pub_year))) {
    return res.status(400).json({ error: `Public year is not valid. Year must be a number.` });
  }
  let author = await db.all(`SELECT * FROM authors WHERE id = ${book.author_id}`);
  if (author.length === 0) {
    return res.status(400).json({ error: `No authors with ID ${book.author_id} found. Please check the authors list to see valid author ID or to add new author.` });
  }
  let id = (await db.all("SELECT * FROM books")).length > 0 ? await db.all("SELECT MAX(CAST(id AS INT )) FROM books") : "1";
  let INSERT_SQL = await db.prepare(
    "INSERT INTO books(id, author_id, title, pub_year, genre) VALUES (?, ?, ?, ?, ?)" 
  );
  await INSERT_SQL.bind([id, book.author_id, book.title, book.pub_year, book.genre]);
  await INSERT_SQL.run().then(() => {
    return res.sendStatus(200).json({ message: `Successfully added. Book ID is ${id}`, table: book });
  });
});

// put to update a book
router.put("/api/book/:id", async (req, res: BookResponse) => {
  const bookReq = req.body.book;
  const id = req.params.id;
  if (!bookReq) {
    return res.status(400).json({ error: "Book is required" });
  }
  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }
  let book = await db.all(`SELECT * FROM books WHERE id = ${id}`);
  if (book.length === 0) {
    return res.status(400).json({ error: `No books with ID ${id} found. Please check the books list to see valid book ID.` });
  }
  await db.run(`UPDATE books set author_id = ?, title = ?, pub_year = ?, genre = ? WHERE id = ?`,
         [bookReq.author_id, bookReq.title, bookReq.pub_year, bookReq.genre, id]);
  return res.sendStatus(200);
});

router.delete("/api/book/:id", async (req, res: BookResponse) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }
  let book = await db.all(`SELECT * FROM books WHERE id = ${id}`);
  if(book.length === 0) {
    return res.status(400).json({ error: `No books with ID ${id} found. Please check the books list to see valid book ID.` });
  }
  await db.run(`DELETE FROM books WHERE id = ?`, [id]);
  return res.sendStatus(200);
});

export default router;