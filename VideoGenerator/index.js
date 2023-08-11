const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = async function (context, req) {
  try {
    context.log(
      "HTTP trigger function for video generation processed a request."
    );

    const imageUrls = req.body.imageUrls;
    const timeInBetween = parseFloat(req.query.time_in_between) || 1.0;

    if (!imageUrls || !Array.isArray(imageUrls)) {
      context.res = {
        status: 400,
        body: "Invalid input. Provide an array of image URLs in the request body.",
      };
      return;
    }

    const tempDir = path.join(
      context.executionContext.functionDirectory,
      "temp"
    );
    try {
      await fs.mkdir(tempDir);
    } catch (error) {
      // Directory already exists, which is fine
    }

    const downloadedImages = await Promise.all(
      imageUrls.map(async (imageUrl, index) => {
        try {
          const response = await axios.get(imageUrl, {
            responseType: "arraybuffer",
          });
          const imageName = `image_${index + 1}.jpg`;
          const imagePath = path.join(tempDir, imageName);
          await fs.writeFile(imagePath, response.data);
          return imagePath;
        } catch (error) {
          context.log(`Error downloading ${imageUrl}: ${error.message}`);
          return null;
        }
      })
    );

    const outputVideoPath = path.join(tempDir, "output.mp4");

    const ffmpegCommand = ffmpeg();
    for (let i = 0; i < downloadedImages.length + 1; i++) {
      if (downloadedImages[i]) {
        ffmpegCommand
          .input(downloadedImages[i])
          .inputOptions("-framerate", `${1 / timeInBetween}`);
      }
    }

    ffmpegCommand
      .videoCodec("libx264")
      .outputOptions("-pix_fmt", "yuv420p")
      .output(outputVideoPath)
      .on("end", () => {
        context.log("Video generation successful.");
        context.res = {
          status: 200,
          body: "Video generation and cleanup successful.",
        };
      })
      .on("error", (err) => {
        context.log.error("Error generating video:", err.message);
        context.res = {
          status: 500,
          body: "Error generating video: " + err.message,
        };
        context.done();
      })
      .run();
  } catch (error) {
    context.log.error("An error occurred:", error.message);
    context.res = {
      status: 500,
      body: "An error occurred: " + error.message,
    };
    context.done();
  }
};
