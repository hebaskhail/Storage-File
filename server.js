const express = require("express");
const Multer = require("multer");
const { Storage } = require("@google-cloud/storage");

const app = express();

// firebase init
const storage = new Storage({
  projectId: "<project id>",
  keyFilename: "<serviceAccount file>",
});
const bucket = storage.bucket("<bucket name>");
console.log("buket name is " + bucket.name)
// multer
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});


// upload image to storage function
const uploadImageToStorage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject("No image file");
      }
      let newFileName = `${file.originalname}_${Date.now()}`;
      let fileUpload = bucket.file(newFileName);
      console.log("newFileName is " + fileUpload.name)

      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });
  
      blobStream.on("error", (error) => {
        reject(error);
      });
  
      blobStream.on("finish", async() => {
         // This is first way 
        // The public URL can be used to directly access the file via HTTP.
        /*
        const url = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
        await storage.bucket(bucket.name).file(fileUpload.name).makePublic();
        resolve(url);
        */

        // this is second way
        fileUpload.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 10 * 10, // one min
          }).then(signedUrls => {
            // signedUrls[0] contains the file's public URL
            resolve(signedUrls[0])
          });
      });
  
      blobStream.end(file.buffer);
    });
  };
  
  // Routes
  app.post("/upload", multer.single("file"), (req, res) => {
    let file = req.file;
    if (file) {
      uploadImageToStorage(file)
        .then((url) => {
          return res.status(200).send({
            image: url,
          });
        })
        .catch((error) => {
          return res.status(500).send({
            error: error,
          });
        });
    } else {
      return res.status(422).send({
        error: "file is required",
      });
    }
  });






/** Listen on provided port, on all network interfaces. */
app.listen(3000);
/** Event listener for HTTP server "listening" event. */
app.on("listening", () => {
  console.log(`Listening on port:: ${3000}`)
});
