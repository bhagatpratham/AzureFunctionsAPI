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

    // Checking if valid image URLs are provided
    if (!imageUrls || !Array.isArray(imageUrls)) {
      context.res = {
        status: 400,
        body: "Invalid input. Provide an array of image URLs in the request body.",
      };
      return;
    }

    // Creating a temporary directory for storing images and videos
    const tempDir = path.join(
      context.executionContext.functionDirectory,
      "temp"
    );
    try {
      await fs.mkdir(tempDir);
    } catch (error) {
      // Directory already exists, which is fine
    }

    // Download and save images
    const downloadedImages = await Promise.all(
      imageUrls.map(async (imageUrl, index) => {
        try {
          context.log("Downloading Image:", imageUrl);
          const response = await axios.get(imageUrl, {
            responseType: "arraybuffer",
          });
          const imageName = `image_${index + 1}.png`;
          const imagePath = path.join(tempDir, imageName);
          await fs.writeFile(imagePath, response.data);
          context.log("Image Successfully Downloaded:", imagePath);
          return imagePath;
        } catch (error) {
          context.log(`Error downloading ${imageUrl}: ${error.message}`);
          return null;
        }
      })
    );
    context.log("Downloaded Images:", downloadedImages);

    // Output video path
    const outputVideoPath = path.join(tempDir, "output.mp4");

    // FFmpeg command for video generation
    let ffmpegCommand = ffmpeg();
    for (let i = 0; i < downloadedImages.length; i++) {
      context.log("Creating Video with Image:", downloadedImages[i]);
      ffmpegCommand
        .input(downloadedImages[i])
        .inputOptions(["-framerate", `1/${timeInBetween}`])
        .inputFormat("image2")
        .videoCodec("libx264")
        .outputOptions(["-pix_fmt", "yuv420p"]);
    }

    // Executing FFmpeg command
    ffmpegCommand
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
      })
      .run();
  } catch (error) {
    context.log.error("An error occurred:", error.message);
    context.res = {
      status: 500,
      body: "An error occurred: " + error.message,
    };
  }
};
