const Book = require("../models/Book");
const path = require("path");
const fs = require("fs");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary.helper");

async function getBooks(req, res) {
  try {
    const books = await Book.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      message: "User's books retrieved successfully!",
      count: books.length,
      books,
    });
  } catch (error) {
    console.error("Error getting books:", error);

    return res.status(500).json({ error: "Internal Server Error!" });
  }
}

async function getBookById(req, res) {
  try {
    const { bookId } = req.params;

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ error: "Book not found!" });
    }

    // Check authorization
    if (book.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ error: "Forbidden: You don't have access to this book!" });
    }

    return res.status(200).json({
      message: "Book retrieved successfully!",
      book,
    });
  } catch (error) {
    console.error("Error getting book:", error);

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid book ID format!" });
    }

    return res.status(500).json({ error: "Internal Server Error!" });
  }
}

async function createBook(req, res) {
  try {
    const { title, subtitle, author, chapters } = req.body;

    // Validate required fields
    if (!title || !author) {
      return res.status(400).json({ error: "Title and author are required!" });
    }

    const book = await Book.create({
      userId: req.user.id,
      title,
      subtitle,
      author,
      chapters: chapters || [],
    });

    return res.status(201).json({
      message: "Book created successfully!",
      book,
    });
  } catch (error) {
    console.error("Error creating book:", error);

    return res.status(500).json({ error: "Internal Server Error!" });
  }
}

async function updateBookContent(req, res) {
  try {
    const { bookId } = req.params;

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ error: "Book not found!" });
    }

    // check authorization
    if (book.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ error: "Forbidden: You cannot update this book!" });
    }

    const updateData = {
      title: req.body.title,
      subtitle: req.body.subtitle,
      author: req.body.author,
      chapters: req.body.chapters,
      status: req.body.status,
      coverImage: req.body.coverImage,
    };

    // remove undefined fields to avoid overwriting with undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // update book with validation
    const updatedBook = await Book.findByIdAndUpdate(bookId, updateData, {
      new: true, // return updated document
      runValidators: true, // run Mongoose validators
    });

    return res.status(200).json({
      message: "Book updated successfully!",
      book: updatedBook,
    });
  } catch (error) {
    console.error("Error updating book content:", error);

    // handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid book ID format!" });
    }

    // handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.message,
      });
    }

    return res.status(500).json({ error: "Internal Server Error!" });
  }
}

async function updateBookCover(req, res) {
  try {
    const { bookId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided!" });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ error: "Book not found!" });
    }

    // Check authorization
    if (book.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ error: "Forbidden: You cannot update this book cover!" });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, "ebook/covers");

    // Delete old cover image if it exists in Cloudinary
    if (book.coverImage) {
      await deleteFromCloudinary(book.coverImage);
    }

    // Save Cloudinary secure URL
    book.coverImage = result.secure_url;
    const updatedBook = await book.save();

    return res.status(200).json({
      message: "Book cover updated successfully!",
      book: updatedBook,
    });
  } catch (error) {
    console.error("Error updating book cover image:", error);

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid book ID format!" });
    }

    return res.status(500).json({ error: "Internal Server Error!" });
  }
}

async function deleteBook(req, res) {
  try {
    const { bookId } = req.params;

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ error: "Book not found!" });
    }

    // Check authorization
    if (book.userId.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ error: "Forbidden: You cannot delete this book!" });
    }

    // Delete cover image from Cloudinary if it exists
    if (book.coverImage) {
      await deleteFromCloudinary(book.coverImage);
    }

    await book.deleteOne();

    return res.status(200).json({
      message: "Book deleted successfully!",
      deletedBookId: bookId,
    });
  } catch (error) {
    console.error("Error deleting book:", error);

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid book ID format!" });
    }

    return res.status(500).json({ error: "Internal Server Error!" });
  }
}

async function uploadEditorImageController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided!" });
    }

    const result = await uploadToCloudinary(req.file.buffer, "ebook/editor");
    return res.status(200).json({
      message: "Image uploaded successfully!",
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Error uploading editor image:", error);
    return res.status(500).json({ error: "Internal Server Error!" });
  }
}

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBookContent,
  updateBookCover,
  deleteBook,
  uploadEditorImageController,
};
